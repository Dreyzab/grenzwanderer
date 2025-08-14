import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ActiveQuest, QuestStep } from './types'
import type { QuestId } from './ids'
import logger from '@/shared/lib/logger'

interface QuestState {
  activeQuests: Partial<Record<QuestId, ActiveQuest>>
  completedQuests: QuestId[]
  startQuest: (id: QuestId, step: QuestStep) => void
  advanceQuest: (id: QuestId, step: QuestStep) => void
  completeQuest: (id: QuestId) => void
  hydrate: (data: { id: QuestId; currentStep: QuestStep; completedAt?: number | null }[]) => void
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set) => ({
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
  hydrate: (data) =>
    set(() => {
      const active: Partial<Record<QuestId, ActiveQuest>> = {}
      const completed: QuestId[] = []
      const now = Date.now()
      for (const d of data) {
        if (d.completedAt) {
          completed.push(d.id)
        } else {
          active[d.id] = { id: d.id, currentStep: d.currentStep, startedAt: now }
        }
      }
      logger.info('STORE', 'hydrate', { activeKeys: Object.keys(active), completed })
      return { activeQuests: active, completedQuests: completed }
    }),
    }),
    {
      name: 'quest-progress',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ activeQuests: s.activeQuests, completedQuests: s.completedQuests }),
      migrate: (persisted, _version) => persisted as any,
    },
  ),
)


