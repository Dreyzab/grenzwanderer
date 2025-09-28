export type QuestId = string

export type QuestStep =
  | 'not_started'
  | 'started'
  | 'exploration'
  | 'research'
  | 'completed'
  | 'unavailable'

export interface ActiveQuest {
  id: QuestId
  currentStep: QuestStep
  startedAt: number
  completedAt?: number
}

export interface QuestEvent {
  type: 'quest.started' | 'quest.advanced' | 'quest.completed'
  questId: QuestId
  step?: QuestStep
  from?: QuestStep
  to?: QuestStep
  context?: Record<string, any>
  timestamp?: number
}
