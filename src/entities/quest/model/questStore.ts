import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ActiveQuest, QuestStep } from './types'
import type { QuestId } from './ids'
import logger from '@/shared/lib/logger'
import { publishQuestEvent } from '@/entities/quest/domain/events'
import { snapshotToQuestEvents } from '@/entities/quest/domain/projection'
import { useQuestEventLog } from '@/entities/quest/domain/eventLog'

interface QuestState {
  activeQuests: Partial<Record<QuestId, ActiveQuest>>
  completedQuests: QuestId[]
  trackedQuestId?: QuestId
  quests: Partial<Record<QuestId, ActiveQuest>>
  startQuest: (id: QuestId, step: QuestStep) => void
  advanceQuest: (id: QuestId, step: QuestStep) => void
  completeQuest: (id: QuestId) => void
  applyBatch: (quests: { id: QuestId; step?: QuestStep; completedAt?: number | null }[]) => void
  hydrate: (data: { id: QuestId; currentStep: QuestStep; completedAt?: number | null }[]) => void
  setTrackedQuest: (id: QuestId) => void
}

function createStartedQuest(id: QuestId, step: QuestStep): ActiveQuest {
  return { id, currentStep: step, startedAt: Date.now() }
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      activeQuests: {},
      completedQuests: [],
      trackedQuestId: undefined,
      quests: {},
      startQuest: (id, step) =>
        set((s) => {
          logger.info('STORE', 'startQuest', id, step)
          publishQuestEvent({
            type: 'quest.started',
            questId: id,
            step,
            context: { origin: 'questStore.startQuest' },
          })
          const nextCompleted = (s.completedQuests ?? []).filter((q) => q !== id)
          const tracked = s.trackedQuestId ?? id
          const activeQuests = {
            ...s.activeQuests,
            [id]: createStartedQuest(id, step),
          }
          return {
            activeQuests,
            completedQuests: nextCompleted,
            trackedQuestId: tracked,
            quests: activeQuests,
          }
        }),
      advanceQuest: (id, step) =>
        set((s) => {
          logger.info('STORE', 'advanceQuest', id, '->', step)
          const prev = s.activeQuests[id]?.currentStep
          if (prev === step) return {} as Partial<QuestState>
          publishQuestEvent({
            type: 'quest.advanced',
            questId: id,
            from: (prev ?? 'not_started') as QuestStep,
            to: step,
            context: { origin: 'questStore.advanceQuest' },
          })
          const activeQuests = {
            ...s.activeQuests,
            [id]: {
              ...(s.activeQuests[id] ?? createStartedQuest(id, step)),
              currentStep: step,
            },
          }
          return {
            activeQuests,
            quests: activeQuests,
          }
        }),
      completeQuest: (id) =>
        set((s) => {
          logger.info('STORE', 'completeQuest', id)
          const { [id]: removed, ...rest } = s.activeQuests
          const finalStep = removed?.currentStep ?? 'completed'
          publishQuestEvent({
            type: 'quest.completed',
            questId: id,
            step: finalStep as QuestStep,
            context: { origin: 'questStore.completeQuest' },
          })
          let nextTracked = s.trackedQuestId
          if (nextTracked === id) {
            const next = Object.values(rest)[0] as ActiveQuest | undefined
            nextTracked = next?.id
          }
          return {
            activeQuests: rest,
            completedQuests: Array.from(new Set([...(s.completedQuests ?? []), id])),
            trackedQuestId: nextTracked,
            quests: rest,
          }
        }),
      applyBatch: (quests) =>
        set((s) => {
          const active = { ...s.activeQuests }
          const completed = new Set(s.completedQuests ?? [])
          let tracked = s.trackedQuestId
          for (const q of quests) {
            if (q.completedAt) {
              const prev = active[q.id]
              if (prev) {
                publishQuestEvent({
                  type: 'quest.completed',
                  questId: q.id,
                  step: prev.currentStep,
                  context: { origin: 'questStore.applyBatch' },
                })
              }
              delete active[q.id]
              completed.add(q.id)
              if (tracked === q.id) {
                const next = Object.values(active)[0] as ActiveQuest | undefined
                tracked = next?.id
              }
            } else if (q.step) {
              const prev = active[q.id]?.currentStep
              if (!prev) {
                publishQuestEvent({
                  type: 'quest.started',
                  questId: q.id,
                  step: q.step,
                  context: { origin: 'questStore.applyBatch' },
                })
              } else if (prev !== q.step) {
                publishQuestEvent({
                  type: 'quest.advanced',
                  questId: q.id,
                  from: prev,
                  to: q.step,
                  context: { origin: 'questStore.applyBatch' },
                })
              }
              active[q.id] = {
                ...(active[q.id] ?? createStartedQuest(q.id, q.step)),
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
            quests: active,
          }
        }),
      hydrate: (data) => {
        const events = snapshotToQuestEvents(
          data.map((d) => ({ id: d.id, currentStep: d.currentStep, completedAt: d.completedAt ?? undefined })),
          'server',
        )
        useQuestEventLog.getState().reset(events)
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
          return { activeQuests: active, completedQuests: completed, trackedQuestId: tracked, quests: active }
        })
      },
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



