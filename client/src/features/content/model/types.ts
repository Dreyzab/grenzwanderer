export interface ContentItem {
  id: string
  type: ContentType
  name: string
  description: string
  content: any // JSON контент
  metadata: ContentMetadata
  tags: string[]
  difficulty: number
  estimatedDuration: number
  prerequisites?: string[]
  rewards?: ContentReward[]
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export type ContentType =
  | 'quest'
  | 'dialogue'
  | 'location'
  | 'npc'
  | 'item'
  | 'event'
  | 'tutorial'

export interface ContentMetadata {
  author: string
  version: string
  language: string
  category: string
  subcategory?: string
  targetAudience: string
  playtestNotes?: string
  balanceRating: number
}

export interface ContentReward {
  type: 'experience' | 'reputation' | 'items' | 'currency' | 'unlock'
  amount: number
  description: string
}

export interface ContentBalance {
  id: string
  contentId: string
  metrics: BalanceMetrics
  playerFeedback: PlayerFeedback[]
  adjustments: BalanceAdjustment[]
  lastAnalyzed: number
  status: 'stable' | 'needs_adjustment' | 'experimental'
}

export interface BalanceMetrics {
  completionRate: number
  averageTime: number
  difficultyRating: number
  enjoymentRating: number
  replayability: number
  playerRetention: number
  dropOffPoints: string[]
}

export interface PlayerFeedback {
  playerId: string
  rating: number
  comment: string
  timestamp: number
  sessionData: any
}

export interface BalanceAdjustment {
  timestamp: number
  changes: Record<string, any>
  reason: string
  expectedImpact: string
}

export interface ContentAnalytics {
  totalViews: number
  uniquePlayers: number
  completionRate: number
  averageRating: number
  timeSpent: number
  difficultyDistribution: Record<string, number>
  popularPaths: string[]
  problemAreas: string[]
}

export interface ABTest {
  id: string
  name: string
  description: string
  variants: ABVariant[]
  targetMetric: string
  startDate: number
  endDate?: number
  status: 'planning' | 'active' | 'completed' | 'cancelled'
  results?: ABTestResults
}

export interface ABVariant {
  id: string
  name: string
  content: any
  weight: number
  participants: string[]
}

export interface ABTestResults {
  winner: string
  confidence: number
  statisticalSignificance: number
  variantResults: Record<string, any>
}

export interface ContentLibrary {
  quests: ContentItem[]
  dialogues: ContentItem[]
  locations: ContentItem[]
  npcs: ContentItem[]
  items: ContentItem[]
  events: ContentItem[]
  tutorials: ContentItem[]
}

export interface ContentValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  estimatedDifficulty: number
  estimatedDuration: number
}

export interface ContentGenerationRule {
  type: 'random' | 'procedural' | 'template'
  parameters: Record<string, any>
  constraints: ContentConstraint[]
}

export interface ContentConstraint {
  type: 'required' | 'optional' | 'forbidden'
  field: string
  value: any
  description: string
}
