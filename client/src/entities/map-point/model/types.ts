import type { BaseCoordinates, BaseMapBounds } from '@/shared/types/core/mapPoint'

export type MapPointType =
  | 'quest_location'
  | 'npc'
  | 'npc_spawn'
  | 'anomaly'
  | 'settlement'
  | 'shop'
  | 'safe_zone'
  | 'hidden_cache'
  | 'danger_zone'
  | 'shelter'
  | 'quest'
  | 'event'
  | 'landmark'
  | 'resource'

export interface MapPoint {
  id: string
  title: string
  description?: string
  coordinates: BaseCoordinates
  type: MapPointType
  isActive: boolean
  questId?: string
  dialogKey?: string
  eventKey?: string
  radius?: number
  icon?: string
}

export interface VisibleMapPoint extends MapPoint {
  distance?: number
  isDiscovered?: boolean
  associatedQrCode?: string
}

export interface MapPointFilter {
  types?: string[]
  maxDistance?: number
  discoveredOnly?: boolean
  activeOnly?: boolean
}

export interface MapPointInteraction {
  isSelectable: boolean
  isInteractable: boolean
  distance?: number
  requiresQrCode?: boolean
}

export interface MapBounds extends BaseMapBounds {}

export const InteractionState = {
  NOT_AVAILABLE: 'NOT_AVAILABLE',
  TOO_FAR: 'TOO_FAR',
  AVAILABLE: 'AVAILABLE',
  INTERACTING: 'INTERACTING',
} as const

export type InteractionStateType = (typeof InteractionState)[keyof typeof InteractionState]


