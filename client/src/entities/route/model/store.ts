import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Route,
  RoutePoint,
  TrackingSession,
  TrackingSettings,
  RouteStats
} from './types'
import { compressTrack, calculateTrackLength } from '../../../shared/lib/geoutils/douglasPeucker'

interface RouteStore {
  // State
  routes: Route[]
  currentSession: TrackingSession | null
  settings: TrackingSettings

  // Actions
  startTracking: (userId: string, deviceId?: string) => void
  stopTracking: () => void
  addPoint: (point: RoutePoint) => void
  saveRoute: (name?: string, description?: string) => Promise<void>
  loadRoutes: (userId: string) => Promise<void>
  deleteRoute: (routeId: string) => void

  // Selectors
  getActiveRoute: () => Route | null
  getRouteById: (routeId: string) => Route | undefined
  getRoutesByDateRange: (startDate: Date, endDate: Date) => Route[]
  getTotalStats: () => RouteStats
  getRecentRoutes: (limit?: number) => Route[]

  // Settings
  updateSettings: (settings: Partial<TrackingSettings>) => void
}

const DEFAULT_SETTINGS: TrackingSettings = {
  enableHighAccuracy: false,
  maxAge: 10000, // 10 seconds
  timeout: 15000, // 15 seconds
  minDistance: 10, // 10 meters
  compressionTolerance: 5, // 5 meters
  maxPointsPerSegment: 100,
  autoSaveInterval: 60000, // 1 minute
}

export const useRouteStore = create<RouteStore>()(
  persist(
    (set, get) => ({
      routes: [],
      currentSession: null,
      settings: DEFAULT_SETTINGS,

      startTracking: (userId, deviceId) => {
        const session: TrackingSession = {
          id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          deviceId,
          isActive: true,
          startTime: Date.now(),
          lastUpdateTime: Date.now(),
          totalDistance: 0,
          settings: get().settings,
        }

        const initialRoute: Route = {
          id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          deviceId,
          points: [],
          startTime: Date.now(),
          totalDistance: 0,
          totalDuration: 0,
          isActive: true,
          metadata: {
            totalPoints: 0,
            tags: [],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        set((state) => ({
          currentSession: session,
          routes: [...state.routes, initialRoute],
        }))
      },

      stopTracking: () => {
        const { currentSession } = get()
        if (!currentSession) return

        set((state) => ({
          currentSession: {
            ...currentSession,
            isActive: false,
          },
          routes: state.routes.map(route =>
            route.isActive
              ? {
                  ...route,
                  endTime: Date.now(),
                  totalDuration: Date.now() - route.startTime,
                  isActive: false,
                  updatedAt: Date.now(),
                }
              : route
          ),
        }))
      },

      addPoint: (point) => {
        const { currentSession, routes } = get()
        if (!currentSession || !currentSession.isActive) return

        const activeRoute = routes.find(r => r.isActive)
        if (!activeRoute) return

        // Добавляем точку к активному маршруту
        const updatedPoints = [...activeRoute.points, point]

        // Компрессия если точек слишком много
        const compressedPoints = compressTrack(updatedPoints, {
          maxPoints: 200,
          minDistance: 3,
          adaptive: true,
        })

        // Пересчитываем статистику
        const totalDistance = calculateTrackLength(compressedPoints)
        const totalDuration = point.timestamp
          ? point.timestamp - activeRoute.startTime
          : Date.now() - activeRoute.startTime

        const updatedRoute: Route = {
          ...activeRoute,
          points: updatedPoints,
          compressedPoints,
          totalDistance,
          totalDuration,
          metadata: {
            ...activeRoute.metadata,
            totalPoints: updatedPoints.length,
            compressionRatio: compressedPoints.length / updatedPoints.length,
          },
          updatedAt: Date.now(),
        }

        set((state) => ({
          currentSession: {
            ...currentSession,
            lastUpdateTime: Date.now(),
            totalDistance,
          },
          routes: state.routes.map(route =>
            route.id === activeRoute.id ? updatedRoute : route
          ),
        }))
      },

      saveRoute: async (name, description) => {
        const { currentSession, routes } = get()
        if (!currentSession) return

        const activeRoute = routes.find(r => r.isActive)
        if (!activeRoute) return

        // Завершаем маршрут
        const completedRoute: Route = {
          ...activeRoute,
          name,
          description,
          endTime: Date.now(),
          totalDuration: Date.now() - activeRoute.startTime,
          isActive: false,
          updatedAt: Date.now(),
        }

        set((state) => ({
          currentSession: null,
          routes: state.routes.map(route =>
            route.id === activeRoute.id ? completedRoute : route
          ),
        }))

        // Здесь будет сохранение в Convex
        // await saveRouteToConvex(completedRoute)
      },

      loadRoutes: async (userId) => {
        try {
          // Здесь будет загрузка из Convex
          // const routes = await getRoutesByUser(userId)
          // set({ routes })
        } catch (error) {
          console.error('Failed to load routes:', error)
        }
      },

      deleteRoute: (routeId) => {
        set((state) => ({
          routes: state.routes.filter(route => route.id !== routeId),
        }))
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        }))
      },

      // Selectors
      getActiveRoute: () => {
        return get().routes.find(route => route.isActive) || null
      },

      getRouteById: (routeId) => {
        return get().routes.find(route => route.id === routeId)
      },

      getRoutesByDateRange: (startDate, endDate) => {
        const { routes } = get()
        const startTime = startDate.getTime()
        const endTime = endDate.getTime()

        return routes.filter(route =>
          route.startTime >= startTime && route.startTime <= endTime
        )
      },

      getTotalStats: () => {
        const { routes } = get()
        const completedRoutes = routes.filter(r => !r.isActive)

        const totalDistance = completedRoutes.reduce((sum, route) => sum + route.totalDistance, 0)
        const totalDuration = completedRoutes.reduce((sum, route) => sum + route.totalDuration, 0)

        return {
          totalRoutes: completedRoutes.length,
          totalDistance,
          totalDuration,
          averageSpeed: totalDuration > 0 ? (totalDistance / totalDuration) * 1000 : 0, // м/с
          favoriteRoutes: [], // TODO: implement favorites
          recentRoutes: completedRoutes
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5),
          monthlyStats: [], // TODO: implement monthly stats
        }
      },

      getRecentRoutes: (limit = 5) => {
        const { routes } = get()
        return routes
          .filter(route => !route.isActive)
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, limit)
      },
    }),
    {
      name: 'grenzwanderer-routes',
      partialize: (state) => ({
        routes: state.routes,
        settings: state.settings,
      }),
    }
  )
)
