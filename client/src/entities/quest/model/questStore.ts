import { create } from 'zustand'
import type { ActiveQuest, DeliveryQuestId, DeliveryQuestStep } from './types'
import logger from '@/shared/lib/logger'

interface QuestState {
  activeQuests: Partial<Record<DeliveryQuestId, ActiveQuest>>
  completedQuests: DeliveryQuestId[]
  startQuest: (id: DeliveryQuestId, step: DeliveryQuestStep) => void
  advanceQuest: (id: DeliveryQuestId, step: DeliveryQuestStep) => void
  completeQuest: (id: DeliveryQuestId) => void
}

export const useQuestStore = create<QuestState>((set) => ({
  activeQuests: {},
  completedQuests: [],
  startQuest: (id, step) =>
    set((s) => {
      logger.info('STORE', 'startQuest', id, step)
      return {
        activeQuests: {
          ...s.activeQuests,
          [id]: { id, currentStep: step, startedAt: Date.now() },
        },
      }
    }),
  advanceQuest: (id, step) =>
    set((s) => {
      logger.info('STORE', 'advanceQuest', id, '->', step)
      return {
        activeQuests: {
          ...s.activeQuests,
          [id]: {
            ...(s.activeQuests[id] ?? { id, startedAt: Date.now(), currentStep: step }),
            currentStep: step,
          },
        },
      }
    }),
  completeQuest: (id) =>
    set((s) => {
      logger.info('STORE', 'completeQuest', id)
      const { [id]: _removed, ...rest } = s.activeQuests
      return {
        activeQuests: rest,
        completedQuests: Array.from(new Set([...(s.completedQuests ?? []), id])),
      }
    }),
}))


