export interface Quest {
  id: string
  title: string
  description: string
  type: 'main' | 'side' | 'daily' | 'event'
  status: 'not_started' | 'in_progress' | 'completed' | 'failed'
  requirements?: QuestRequirement
  rewards?: QuestReward
  objectives: QuestObjective[]
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface QuestRequirement {
  minPhase?: number
  prerequisites?: string[]
  reputation?: {
    combat?: number
    exploration?: number
    social?: number
    reliability?: number
  }
  items?: string[]
  location?: {
    lat: number
    lng: number
    radius: number
  }
}

export interface QuestReward {
  experience?: number
  reputation?: {
    combat?: number
    exploration?: number
    social?: number
    reliability?: number
  }
  items?: string[]
  currency?: number
}

export interface QuestObjective {
  id: string
  description: string
  type: 'visit_location' | 'defeat_enemy' | 'collect_item' | 'talk_to_npc' | 'custom'
  target?: string
  current?: number
  required?: number
  completed: boolean
}

export interface QuestProgress {
  questId: string
  status: Quest['status']
  objectives: Record<string, boolean>
  startedAt?: number
  completedAt?: number
  createdAt: number
  updatedAt: number
}
