import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type QuestId = string
export type QuestStep = string

export interface QuestProgress {
  id: QuestId
  step: QuestStep
  startedAt: number
  updatedAt: number
  completedAt?: number | null
}

interface QuestState {
  quests: Record<QuestId, QuestProgress>
  trackedQuestId?: QuestId
  startQuest: (id: QuestId, step: QuestStep) => void
  advanceQuest: (id: QuestId, step: QuestStep) => void
  completeQuest: (id: QuestId) => void
  applyBatch: (quests: { id: QuestId; step?: QuestStep; completedAt?: number | null }[]) => void
  hydrate: (data: { id: QuestId; currentStep: QuestStep; completedAt?: number | null }[]) => void
  setTrackedQuest: (id: QuestId | undefined) => void
}

function createStartedQuest(id: QuestId, step: QuestStep): QuestProgress {
  const now = Date.now()
  return { id, step, startedAt: now, updatedAt: now, completedAt: null }
}

function findNextTrackableQuest(quests: Record<QuestId, QuestProgress>, excludeId?: QuestId) {
  return Object.values(quests).find((quest) => quest.step !== 'completed' && quest.id !== excludeId)?.id
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set) => ({
      quests: {},
      trackedQuestId: undefined,
      startQuest: (id, step) =>
        set((state) => {
          const nextQuest = createStartedQuest(id, step)
          return {
            quests: {
              ...state.quests,
              [id]: nextQuest,
            },
            trackedQuestId: state.trackedQuestId ?? id,
          }
        }),
      advanceQuest: (id, step) =>
        set((state) => {
          const existing = state.quests[id]
          if (existing?.step === step) return state
          const now = Date.now()
          return {
            quests: {
              ...state.quests,
              [id]: existing
                ? { ...existing, step, updatedAt: now, completedAt: null }
                : { ...createStartedQuest(id, step), updatedAt: now },
            },
          }
        }),
      completeQuest: (id) =>
        set((state) => {
          const existing = state.quests[id]
          const completedAt = Date.now()
          const updated = {
            ...state.quests,
            [id]: existing
              ? { ...existing, step: 'completed', updatedAt: completedAt, completedAt }
              : {
                  id,
                  step: 'completed',
                  startedAt: completedAt,
                  updatedAt: completedAt,
                  completedAt,
                },
          }
          const tracked = state.trackedQuestId === id ? findNextTrackableQuest(updated, id) : state.trackedQuestId
          return {
            quests: updated,
            trackedQuestId: tracked,
          }
        }),
      applyBatch: (quests) =>
        set((state) => {
          const updated: Record<QuestId, QuestProgress> = { ...state.quests }
          let tracked = state.trackedQuestId
          for (const quest of quests) {
            if (quest.completedAt) {
              const completedAt = quest.completedAt
              const existing = updated[quest.id]
              updated[quest.id] = existing
                ? { ...existing, step: 'completed', updatedAt: completedAt, completedAt }
                : {
                    id: quest.id,
                    step: 'completed',
                    startedAt: completedAt,
                    updatedAt: completedAt,
                    completedAt,
                  }
              if (tracked === quest.id) {
                tracked = findNextTrackableQuest(updated, quest.id)
              }
            } else if (quest.step) {
              const existing = updated[quest.id]
              if (existing?.step === quest.step) continue
              const now = Date.now()
              updated[quest.id] = existing
                ? { ...existing, step: quest.step, updatedAt: now, completedAt: quest.completedAt ?? null }
                : createStartedQuest(quest.id, quest.step)
              if (!tracked) {
                tracked = quest.id
              }
            }
          }
          return {
            quests: updated,
            trackedQuestId: tracked,
          }
        }),
      hydrate: (data) =>
        set((state) => {
          const next: Record<QuestId, QuestProgress> = {}
          for (const quest of data) {
            if (quest.completedAt) {
              next[quest.id] = {
                id: quest.id,
                step: 'completed',
                startedAt: quest.completedAt,
                updatedAt: quest.completedAt,
                completedAt: quest.completedAt,
              }
            } else {
              const now = Date.now()
              next[quest.id] = {
                id: quest.id,
                step: quest.currentStep,
                startedAt: now,
                updatedAt: now,
                completedAt: quest.completedAt ?? null,
              }
            }
          }
          const tracked = state.trackedQuestId ?? findNextTrackableQuest(next)
          return {
            quests: next,
            trackedQuestId: tracked,
          }
        }),
      setTrackedQuest: (id) => set(() => ({ trackedQuestId: id })),
    }),
    {
      name: 'quest-progress',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        quests: state.quests,
        trackedQuestId: state.trackedQuestId,
      }),
    },
  ),
)
