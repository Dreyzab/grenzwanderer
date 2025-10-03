// Типы для точек карты согласно схеме Convex
export type MapPointId = string

export type MapPointType = 
  | 'poi'         // Point of Interest
  | 'quest'       // Квестовая точка
  | 'npc'         // NPC персонаж
  | 'location'    // Локация
  | 'board'       // Доска объявлений
  | 'settlement'  // Поселение
  | 'anomaly'     // Аномальная зона

export type MapPointStatus = 'not_found' | 'discovered' | 'researched'

export type MapPointCategory =
  | 'storage'
  | 'workshop'
  | 'medical'
  | 'bulletin_board'
  | 'briefing_point'
  | 'religious'
  | 'anarchist_zone'
  | 'hideout'
  | 'bar'
  | 'anomaly'

export type FactionType = 
  | 'synthesis'
  | 'fjr'
  | 'old_believers'
  | 'anarchists'
  | 'neutral'

export type ServiceType =
  | 'trade'
  | 'storage'
  | 'repair'
  | 'crafting'
  | 'upgrade'
  | 'healing'
  | 'medicine_trade'
  | 'first_aid_training'
  | 'quests'
  | 'recruitment'
  | 'news'
  | 'blessing'
  | 'confession'
  | 'shelter'
  | 'black_market'
  | 'underground_intel'
  | 'refuge'
  | 'information'
  | 'rumors'
  | 'rest'
  | 'drinks'
  | 'exploration'
  | 'artifact_hunting'

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
  metadata?: MapPointMetadata
  createdAt: number

  // Расширенные поля для системы исследования
  status?: MapPointStatus
  discoveredAt?: number
  researchedAt?: number
  discoveredBy?: string // deviceId игрока
}

// Расширенные метаданные для точек карты
export interface MapPointMetadata {
  category?: MapPointCategory
  faction?: FactionType
  services?: ServiceType[]
  
  // NPC связанные данные
  npcId?: string
  characterName?: string
  npcs?: string[]
  dialogues?: string[]
  
  // Квесты
  questBindings?: string[]
  availableQuests?: Record<string, boolean>
  
  // Атмосфера и описание
  atmosphere?: string
  danger_level?: 'low' | 'medium' | 'high' | 'extreme'
  
  // Функциональность
  inventoryAccess?: boolean
  tradeOptions?: {
    blackMarket?: boolean
    stolenGoods?: boolean
    contraband?: boolean
  }
  
  // Требования
  requiresFaction?: FactionType
  minReputation?: number
  unlockRequirements?: string[]
  requiresEquipment?: string[]
  recommendedLevel?: number
  
  // Отношения с NPC
  relationship?: {
    initialLevel: number
    maxLevel: number
    reputationRequired?: number
    bonuses?: Record<string, string>
  }
  
  // Специальные возможности
  socialHub?: boolean
  informationQuality?: 'low' | 'medium' | 'high'
  priceRange?: 'low' | 'medium' | 'high'
  specialFeatures?: Record<string, boolean>
  
  // Опасности и награды (для аномалий)
  hazards?: {
    radiation?: 'low' | 'medium' | 'high'
    temporal_distortion?: 'low' | 'medium' | 'high'
    hostile_entities?: 'low' | 'medium' | 'high'
  }
  rewards?: {
    artifacts?: boolean
    rareResources?: boolean
    scientificData?: boolean
  }
  
  // Дополнительные флаги
  hidden?: boolean
  lawless?: boolean
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

