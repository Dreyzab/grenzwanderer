import { useCallback } from 'react'
import { useQuestStore } from './questStore'
import type { QuestStep } from './types'
import type { QuestId } from './ids'

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
      startQuest(id, step)
    },
    advanceQuest: async (id: QuestId, step: QuestStep) => {
      advanceQuest(id, step)
    },
    completeQuest: async (id: QuestId) => {
      completeQuest(id)
    },
    hydrate,
  }
}


