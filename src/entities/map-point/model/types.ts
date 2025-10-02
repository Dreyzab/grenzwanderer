// Типы для точек карты согласно схеме Convex
export type MapPointId = string

export type MapPointType = 'poi' | 'quest' | 'npc' | 'location'

export type MapPointStatus = 'not_found' | 'discovered' | 'researched'

export interface MapPointCoordinates {
  lat: number
  lng: number
}

export interface MapPoint {
  _id?: string // Convex ID
  id: MapPointId
  title: string
  description: string
  coordinates: MapPointCoordinates
  type: MapPointType
  phase?: number
  isActive: boolean
  metadata?: Record<string, any>
  createdAt: number

  // Расширенные поля для системы исследования
  status?: MapPointStatus
  discoveredAt?: number
  researchedAt?: number
  discoveredBy?: string // deviceId игрока
}

export interface MapPointFilter {
  type?: MapPointType[]
  phase?: number[]
  status?: MapPointStatus[]
  isActive?: boolean
  searchQuery?: string
}

export interface MapPointEvent {
  type: 'mapPoint.discovered' | 'mapPoint.researched' | 'mapPoint.statusChanged'
  mapPointId: MapPointId
  playerId?: string
  deviceId?: string
  status?: MapPointStatus
  timestamp?: number
}

// Состояние видимости точки (клиентское)
export interface MapPointVisibility {
  isVisible: boolean
  distance?: number
  inPhase?: boolean
  meetsRequirements?: boolean
  lastSeen?: number
}

// Типы для маркеров на карте
export interface MapMarkerData {
  id: MapPointId
  coordinates: MapPointCoordinates
  type: MapPointType
  status: MapPointStatus
  title: string
  description: string
  distance?: number
}

// Типы для фильтрации по расстоянию
export interface DistanceFilter {
  min?: number // метры
  max?: number // метры
  enabled: boolean
}

// Сортировка точек
export type MapPointSortBy = 'distance' | 'name' | 'type' | 'status' | 'date'
export type MapPointSortOrder = 'asc' | 'desc'

