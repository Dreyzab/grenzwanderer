import { Point } from '../../../shared/lib/geoutils/douglasPeucker'

export interface RoutePoint extends Point {
  accuracy?: number
  speed?: number
  bearing?: number
  altitude?: number
}

export interface Route {
  id: string
  userId: string
  deviceId?: string
  name?: string
  description?: string
  points: RoutePoint[]
  compressedPoints?: RoutePoint[] // Сжатые точки
  startTime: number
  endTime?: number
  totalDistance: number
  totalDuration: number
  isActive: boolean
  metadata: RouteMetadata
  createdAt: number
  updatedAt: number
}

export interface RouteMetadata {
  totalPoints: number
  compressionRatio?: number
  averageSpeed?: number
  maxSpeed?: number
  elevationGain?: number
  elevationLoss?: number
  tags: string[]
}

export interface RouteSegment {
  id: string
  routeId: string
  points: RoutePoint[]
  startIndex: number
  endIndex: number
  startTime: number
  endTime: number
  distance: number
  isCompressed: boolean
}

export interface TrackingSession {
  id: string
  userId: string
  deviceId?: string
  isActive: boolean
  currentRouteId?: string
  startTime: number
  lastUpdateTime: number
  totalDistance: number
  settings: TrackingSettings
}

export interface TrackingSettings {
  enableHighAccuracy: boolean
  maxAge: number // milliseconds
  timeout: number // milliseconds
  minDistance: number // meters
  compressionTolerance: number // meters
  maxPointsPerSegment: number
  autoSaveInterval: number // milliseconds
}

export interface RouteStats {
  totalRoutes: number
  totalDistance: number
  totalDuration: number
  averageSpeed: number
  favoriteRoutes: Route[]
  recentRoutes: Route[]
  monthlyStats: MonthlyStats[]
}

export interface MonthlyStats {
  month: string
  distance: number
  duration: number
  routes: number
  averageSpeed: number
}
