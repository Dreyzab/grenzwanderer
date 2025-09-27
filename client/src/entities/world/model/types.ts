export interface WorldEvent {
  id: string
  type: WorldEventType
  title: string
  description: string
  location?: {
    lat: number
    lng: number
    radius?: number
  }
  zoneId?: string
  startTime: number
  endTime?: number
  isActive: boolean
  effects: WorldEventEffect[]
  participants: WorldEventParticipant[]
  metadata: WorldEventMetadata
  createdAt: number
  updatedAt: number
}

export type WorldEventType =
  | 'anomaly_spawn'
  | 'raid'
  | 'zone_change'
  | 'weather_change'
  | 'npc_migration'
  | 'resource_spawn'
  | 'special_event'

export interface WorldEventEffect {
  type: 'buff' | 'debuff' | 'spawn' | 'despawn' | 'modify'
  target: 'players' | 'npcs' | 'locations' | 'items'
  parameters: Record<string, any>
  duration?: number
}

export interface WorldEventParticipant {
  playerId: string
  joinTime: number
  contribution: number
  rewards?: WorldEventReward[]
}

export interface WorldEventReward {
  type: 'experience' | 'reputation' | 'items' | 'currency'
  amount: number
  description: string
}

export interface WorldEventMetadata {
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  maxParticipants?: number
  estimatedDuration: number
  tags: string[]
  prerequisites?: string[]
  cooldown?: number
}

export interface AnomalyZone {
  id: string
  type: AnomalyType
  location: { lat: number; lng: number }
  radius: number
  intensity: number
  effects: AnomalyEffect[]
  spawnTime: number
  despawnTime?: number
  isActive: boolean
}

export type AnomalyType =
  | 'radiation'
  | 'temporal'
  | 'gravity'
  | 'chemical'
  | 'electromagnetic'

export interface AnomalyEffect {
  type: 'damage' | 'buff' | 'debuff' | 'teleport' | 'spawn'
  value: number
  duration?: number
  probability: number
}

export interface RaidEvent {
  id: string
  type: RaidType
  location: { lat: number; lng: number }
  startTime: number
  estimatedDuration: number
  difficulty: 'easy' | 'medium' | 'hard'
  maxParticipants: number
  currentParticipants: number
  rewards: RaidReward[]
  requirements: RaidRequirement[]
  isActive: boolean
}

export type RaidType =
  | 'supply_run'
  | 'boss_fight'
  | 'extraction'
  | 'escort'
  | 'defend'

export interface RaidReward {
  type: 'experience' | 'reputation' | 'items' | 'currency'
  amount: number
  probability: number
}

export interface RaidRequirement {
  type: 'level' | 'reputation' | 'items' | 'time'
  value: any
  description: string
}

export interface ZoneChangeEvent {
  zoneId: string
  changeType: 'weather' | 'danger_level' | 'resource_availability' | 'npc_presence'
  oldValue: any
  newValue: any
  duration?: number
  reason?: string
}
