// Базовые типы для системы точек карты
// Единый источник истины для всех слоев приложения

export interface BaseCoordinates {
  lat: number
  lng: number
}

export interface BaseMapPoint {
  id: string
  title: string
  description: string
  coordinates: BaseCoordinates
  radius: number
  icon: string
  isActive: boolean
  dialogKey?: string
  eventKey?: string
}

export interface BaseMapBounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}


