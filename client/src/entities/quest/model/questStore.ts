import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ActiveQuest, QuestStep } from './types'
import type { QuestId } from './ids'
import logger from '@/shared/lib/logger'

interface QuestState {
  activeQuests: Partial<Record<QuestId, ActiveQuest>>
  completedQuests: QuestId[]
  trackedQuestId?: QuestId
  startQuest: (id: QuestId, step: QuestStep) => void
  advanceQuest: (id: QuestId, step: QuestStep) => void
  completeQuest: (id: QuestId) => void
  applyBatch: (quests: { id: QuestId; step?: QuestStep; completedAt?: number | null }[]) => void
  hydrate: (data: { id: QuestId; currentStep: QuestStep; completedAt?: number | null }[]) => void
  setTrackedQuest: (id: QuestId) => void
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set) => ({
  activeQuests: {},
  completedQuests: [],
  trackedQuestId: undefined,
  startQuest: (id, step) =>
    set((s) => {
      logger.info('STORE', 'startQuest', id, step)
      const nextCompleted = (s.completedQuests ?? []).filter((q) => q !== (id as any))
      const tracked = s.trackedQuestId ?? id
      return {
        activeQuests: {
          ...s.activeQuests,
          [id]: { id, currentStep: step, startedAt: Date.now() },
        },
        completedQuests: nextCompleted,
        trackedQuestId: tracked,
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
      let nextTracked = s.trackedQuestId
      if (s.trackedQuestId === id) {
        // выбрать произвольный следующий активный (без сортировки, достаточно первого)
        const next = Object.values(rest)[0] as ActiveQuest | undefined
        nextTracked = next?.id
      }
      return {
        activeQuests: rest,
        completedQuests: Array.from(new Set([...(s.completedQuests ?? []), id])),
        trackedQuestId: nextTracked,
      }
    }),
  applyBatch: (quests) =>
    set((s) => {
      const active = { ...s.activeQuests }
      const completed = new Set(s.completedQuests ?? [])
      let tracked = s.trackedQuestId
      for (const q of quests) {
        if (q.completedAt) {
          delete active[q.id]
          completed.add(q.id)
          if (tracked === q.id) {
            const next = Object.values(active)[0] as ActiveQuest | undefined
            tracked = next?.id
          }
        } else if (q.step) {
          active[q.id] = {
            ...(active[q.id] ?? { id: q.id, startedAt: Date.now(), currentStep: q.step }),
            currentStep: q.step,
          }
          completed.delete(q.id)
          if (!tracked) tracked = q.id
        }
      }
      logger.info('STORE', 'applyBatch', { quests })
      return {
        activeQuests: active,
        completedQuests: Array.from(completed),
        trackedQuestId: tracked,
      }
    }),
  hydrate: (data) =>
    set((s) => {
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
      const firstActive = Object.values(active)[0] as ActiveQuest | undefined
      const tracked = s.trackedQuestId ?? firstActive?.id
      return { activeQuests: active, completedQuests: completed, trackedQuestId: tracked }
    }),
  setTrackedQuest: (id) => set(() => ({ trackedQuestId: id })),
    }),
    {
      name: 'quest-progress',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ activeQuests: s.activeQuests, completedQuests: s.completedQuests, trackedQuestId: s.trackedQuestId }),
      migrate: (persisted, _version) => persisted as any,
    },
  ),
)


