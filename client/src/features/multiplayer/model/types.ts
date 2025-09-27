export interface MultiplayerSession {
  id: string
  type: MultiplayerType
  name: string
  description: string
  hostId: string
  participants: MultiplayerParticipant[]
  maxParticipants: number
  status: 'waiting' | 'active' | 'completed' | 'cancelled'
  settings: MultiplayerSettings
  location?: {
    lat: number
    lng: number
    radius: number
  }
  startTime?: number
  endTime?: number
  createdAt: number
  updatedAt: number
}

export type MultiplayerType =
  | 'quest_coop'
  | 'raid_group'
  | 'trade_meetup'
  | 'social_gathering'
  | 'exploration_party'

export interface MultiplayerParticipant {
  playerId: string
  username: string
  role: 'host' | 'participant' | 'spectator'
  joinTime: number
  lastActivity: number
  status: 'active' | 'inactive' | 'left'
  contribution: number
  rewards?: MultiplayerReward[]
}

export interface MultiplayerSettings {
  isPublic: boolean
  allowSpectators: boolean
  requireApproval: boolean
  autoStart: boolean
  autoStartDelay: number // minutes
  maxInactiveTime: number // minutes
}

export interface MultiplayerReward {
  type: 'experience' | 'reputation' | 'items' | 'currency'
  amount: number
  description: string
  distributed: boolean
}

export interface TradeOffer {
  id: string
  fromPlayerId: string
  toPlayerId: string
  offeredItems: TradeItem[]
  requestedItems: TradeItem[]
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'
  expiresAt: number
  createdAt: number
}

export interface TradeItem {
  itemId: string
  quantity: number
  condition?: number
}

export interface SocialInteraction {
  id: string
  type: 'message' | 'trade' | 'quest_share' | 'location_share'
  fromPlayerId: string
  toPlayerId: string
  content?: string
  data?: any
  timestamp: number
  read: boolean
}

export interface PlayerProximity {
  playerId: string
  username: string
  distance: number
  lastSeen: number
  location?: {
    lat: number
    lng: number
  }
}

export interface MultiplayerStats {
  totalSessions: number
  activeSessions: number
  totalParticipants: number
  averageSessionDuration: number
  mostActivePlayers: PlayerActivity[]
  recentSessions: MultiplayerSession[]
}

export interface PlayerActivity {
  playerId: string
  username: string
  sessionsJoined: number
  totalPlayTime: number
  favoriteTypes: MultiplayerType[]
  reputation: number
}
