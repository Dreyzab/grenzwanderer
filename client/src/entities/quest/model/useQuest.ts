import { useCallback } from 'react'
import { useQuestStore } from './questStore'
import type { QuestStep } from './types'
import type { QuestId } from './ids'
import { questsApi } from '@/shared/api/quests'

export function useQuest() {
  const { activeQuests, completedQuests, startQuest, advanceQuest, completeQuest, hydrate, trackedQuestId, setTrackedQuest } = useQuestStore()

  const isActive = useCallback((id: QuestId) => Boolean(activeQuests[id]), [activeQuests])
  const getStep = useCallback(
    (id: QuestId): QuestStep | 'not_started' => {
      if (completedQuests.includes(id)) return 'completed'
      return activeQuests[id]?.currentStep ?? 'not_started'
    },
    [activeQuests, completedQuests],
  )

  return {
    activeQuests,
    completedQuests,
    trackedQuestId,
    isActive,
    getStep,
    setTrackedQuest,
    startQuest: async (id: QuestId, step: QuestStep) => {
      // Для квестов с серверными гейтами — сначала сервер, потом локально
      const serverFirst = new Set<QuestId>([
        'loyalty_fjr' as QuestId,
        'water_crisis' as QuestId,
        'freedom_spark' as QuestId,
        'citizenship_invitation' as QuestId,
        'eyes_in_the_dark' as QuestId,
        'void_shards' as QuestId,
      ])
      if (serverFirst.has(id)) {
        try {
          await questsApi.startQuest(id, step)
          startQuest(id, step)
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[QUEST] startQuest failed on server, skipping local update', id, step, e)
        }
      } else {
        // Быстрый локальный апдейт для UX, сервер асинхронно
        startQuest(id, step)
        void questsApi.startQuest(id, step)
      }
    },
    advanceQuest: async (id: QuestId, step: QuestStep) => {
      const serverFirst = new Set<QuestId>([
        'loyalty_fjr' as QuestId,
        'water_crisis' as QuestId,
        'freedom_spark' as QuestId,
        'citizenship_invitation' as QuestId,
        'eyes_in_the_dark' as QuestId,
        'void_shards' as QuestId,
      ])
      if (serverFirst.has(id)) {
        try {
          await questsApi.advanceQuest(id, step)
          advanceQuest(id, step)
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[QUEST] advanceQuest failed on server, skipping local update', id, step, e)
        }
      } else {
        advanceQuest(id, step)
        void questsApi.advanceQuest(id, step)
      }
    },
    completeQuest: async (id: QuestId) => {
      const serverFirst = new Set<QuestId>([
        'loyalty_fjr' as QuestId,
        'water_crisis' as QuestId,
        'freedom_spark' as QuestId,
        'citizenship_invitation' as QuestId,
        'eyes_in_the_dark' as QuestId,
        'void_shards' as QuestId,
      ])
      if (serverFirst.has(id)) {
        try {
          await questsApi.completeQuest(id)
          completeQuest(id)
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[QUEST] completeQuest failed on server, skipping local update', id, e)
        }
      } else {
        completeQuest(id)
        void questsApi.completeQuest(id)
      }
    },
    hydrate,
  }
}


