import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  MapPoint,
  MapPointId,
  MapPointStatus,
  MapPointFilter,
  MapPointVisibility,
  MapPointSortBy,
  MapPointSortOrder,
  DistanceFilter
} from './types'

// Состояние точек карты
interface MapPointState {
  // Данные точек
  points: Map<MapPointId, MapPoint>
  visibility: Map<MapPointId, MapPointVisibility>

  // Фильтры и настройки
  activeFilter: MapPointFilter
  distanceFilter: DistanceFilter
  sortBy: MapPointSortBy
  sortOrder: MapPointSortOrder
  selectedPointId: MapPointId | null

  // Состояние загрузки
  isLoading: boolean
  error: string | null
  lastUpdate: number | null

  // Геолокация пользователя
  userLocation: { lat: number; lng: number } | null

  // Кеширование видимых точек
  visiblePoints: MapPointId[]
  visiblePointsLastUpdate: number | null
}

// Действия для управления состоянием
interface MapPointActions {
  // Управление точками
  setPoints: (points: MapPoint[]) => void
  updatePoint: (pointId: MapPointId, updates: Partial<MapPoint>) => void
  removePoint: (pointId: MapPointId) => void

  // Управление видимостью
  setPointVisibility: (pointId: MapPointId, visibility: MapPointVisibility) => void
  updateVisiblePoints: (pointIds: MapPointId[]) => void

  // Фильтрация
  setFilter: (filter: MapPointFilter) => void
  clearFilter: () => void
  setDistanceFilter: (filter: DistanceFilter) => void

  // Сортировка
  setSorting: (sortBy: MapPointSortBy, sortOrder: MapPointSortOrder) => void

  // Выбор точки
  selectPoint: (pointId: MapPointId | null) => void

  // Геолокация
  setUserLocation: (location: { lat: number; lng: number } | null) => void

  // Состояние загрузки
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Обновление статуса точки
  updatePointStatus: (pointId: MapPointId, status: MapPointStatus, timestamp?: number) => void

  // Утилиты
  getFilteredPoints: () => MapPoint[]
  getVisiblePoints: () => MapPoint[]
  getPointById: (pointId: MapPointId) => MapPoint | undefined
  getSortedPoints: (points: MapPoint[]) => MapPoint[]
  reset: () => void
}

type MapPointStore = MapPointState & MapPointActions

// Начальное состояние
const initialState: MapPointState = {
  points: new Map(),
  visibility: new Map(),
  activeFilter: {},
  distanceFilter: { enabled: false },
  sortBy: 'distance',
  sortOrder: 'asc',
  selectedPointId: null,
  isLoading: false,
  error: null,
  lastUpdate: null,
  userLocation: null,
  visiblePoints: [],
  visiblePointsLastUpdate: null,
}

// Создание стора с persist для оффлайн кеширования
export const useMapPointStore = create<MapPointStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Управление точками
      setPoints: (points) => {
        const pointsMap = new Map(points.map(point => [point.id, point]))
        set({
          points: pointsMap,
          lastUpdate: Date.now(),
          error: null,
          isLoading: false
        })
      },

      updatePoint: (pointId, updates) => {
        set((state) => {
          const currentPoint = state.points.get(pointId)
          if (!currentPoint) return state

          const updatedPoint = { ...currentPoint, ...updates }
          const newPoints = new Map(state.points)
          newPoints.set(pointId, updatedPoint)

          return {
            points: newPoints,
            lastUpdate: Date.now()
          }
        })
      },

      removePoint: (pointId) => {
        set((state) => {
          const newPoints = new Map(state.points)
          const newVisibility = new Map(state.visibility)
          newPoints.delete(pointId)
          newVisibility.delete(pointId)

          return {
            points: newPoints,
            visibility: newVisibility,
            selectedPointId: state.selectedPointId === pointId ? null : state.selectedPointId,
            lastUpdate: Date.now()
          }
        })
      },

      // Управление видимостью
      setPointVisibility: (pointId, visibility) => {
        set((state) => ({
          visibility: new Map(state.visibility).set(pointId, visibility)
        }))
      },

      updateVisiblePoints: (pointIds) => {
        set({
          visiblePoints: pointIds,
          visiblePointsLastUpdate: Date.now()
        })
      },

      // Фильтрация
      setFilter: (filter) => {
        set({ activeFilter: filter })
      },

      clearFilter: () => {
        set({ activeFilter: {}, distanceFilter: { enabled: false } })
      },

      setDistanceFilter: (filter) => {
        set({ distanceFilter: filter })
      },

      // Сортировка
      setSorting: (sortBy, sortOrder) => {
        set({ sortBy, sortOrder })
      },

      // Выбор точки
      selectPoint: (pointId) => {
        set({ selectedPointId: pointId })
      },

      // Геолокация
      setUserLocation: (location) => {
        set({ userLocation: location })
      },

      // Состояние загрузки
      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error, isLoading: false })
      },

      // Обновление статуса точки
      updatePointStatus: (pointId, status, timestamp) => {
        const now = timestamp || Date.now()
        set((state) => {
          const currentPoint = state.points.get(pointId)
          if (!currentPoint) return state

          const updates: Partial<MapPoint> = { status }

          switch (status) {
            case 'discovered':
              updates.discoveredAt = now
              break
            case 'researched':
              updates.researchedAt = now
              break
          }

          const updatedPoint = { ...currentPoint, ...updates }
          const newPoints = new Map(state.points)
          newPoints.set(pointId, updatedPoint)

          return {
            points: newPoints,
            lastUpdate: now
          }
        })
      },

      // Утилиты
      getFilteredPoints: () => {
        const { points, activeFilter, userLocation, distanceFilter } = get()
        let pointsArray = Array.from(points.values())

        // Фильтр по типу
        if (activeFilter.type?.length) {
          pointsArray = pointsArray.filter(point => activeFilter.type!.includes(point.type))
        }

        // Фильтр по фазе
        if (activeFilter.phase?.length) {
          pointsArray = pointsArray.filter(point => 
            point.phase !== undefined && activeFilter.phase!.includes(point.phase)
          )
        }

        // Фильтр по статусу
        if (activeFilter.status?.length) {
          pointsArray = pointsArray.filter(point => 
            point.status && activeFilter.status!.includes(point.status)
          )
        }

        // Фильтр по активности
        if (activeFilter.isActive !== undefined) {
          pointsArray = pointsArray.filter(point => point.isActive === activeFilter.isActive)
        }

        // Фильтр по поиску
        if (activeFilter.searchQuery) {
          const query = activeFilter.searchQuery.toLowerCase()
          pointsArray = pointsArray.filter(point => 
            point.title.toLowerCase().includes(query) ||
            point.description.toLowerCase().includes(query)
          )
        }

        // Фильтр по расстоянию
        if (distanceFilter.enabled && userLocation) {
          pointsArray = pointsArray.filter(point => {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              point.coordinates.lat,
              point.coordinates.lng
            )

            if (distanceFilter.min !== undefined && distance < distanceFilter.min) {
              return false
            }
            if (distanceFilter.max !== undefined && distance > distanceFilter.max) {
              return false
            }
            return true
          })
        }

        return pointsArray
      },

      getSortedPoints: (points) => {
        const { sortBy, sortOrder, userLocation } = get()
        const sorted = [...points]

        sorted.sort((a, b) => {
          let comparison = 0

          switch (sortBy) {
            case 'distance':
              if (userLocation) {
                const distA = calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  a.coordinates.lat,
                  a.coordinates.lng
                )
                const distB = calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  b.coordinates.lat,
                  b.coordinates.lng
                )
                comparison = distA - distB
              }
              break
            
            case 'name':
              comparison = a.title.localeCompare(b.title)
              break
            
            case 'type':
              comparison = a.type.localeCompare(b.type)
              break
            
            case 'status':
              const statusOrder = { 'not_found': 0, 'discovered': 1, 'researched': 2 }
              comparison = statusOrder[a.status || 'not_found'] - statusOrder[b.status || 'not_found']
              break
            
            case 'date':
              comparison = (a.discoveredAt || 0) - (b.discoveredAt || 0)
              break
          }

          return sortOrder === 'asc' ? comparison : -comparison
        })

        return sorted
      },

      getVisiblePoints: () => {
        const { points, visiblePoints } = get()
        return visiblePoints
          .map(id => points.get(id))
          .filter((point): point is MapPoint => point !== undefined)
      },

      getPointById: (pointId) => {
        return get().points.get(pointId)
      },

      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'map-point-storage',
      storage: createJSONStorage(() => localStorage),
      // Сохраняем только критически важные данные для оффлайна
      partialize: (state) => ({
        points: Array.from(state.points.entries()),
        visibility: Array.from(state.visibility.entries()),
        activeFilter: state.activeFilter,
        distanceFilter: state.distanceFilter,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        userLocation: state.userLocation,
        lastUpdate: state.lastUpdate,
      }),
      // Кастомная десериализация для Map структур
      onRehydrateStorage: () => (state) => {
        if (state) {
          // @ts-ignore - rehydration typing
          if (Array.isArray(state.points)) {
            // @ts-ignore
            state.points = new Map(state.points)
          }
          // @ts-ignore
          if (Array.isArray(state.visibility)) {
            // @ts-ignore
            state.visibility = new Map(state.visibility)
          }
        }
      },
    }
  )
)

// Вспомогательная функция для расчета расстояния (формула Haversine)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // Радиус Земли в метрах
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

