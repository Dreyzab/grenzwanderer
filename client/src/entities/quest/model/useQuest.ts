import { useCallback } from 'react'
import { useQuestStore } from './questStore'
import type { QuestStep } from './types'
import type { QuestId } from './ids'
import { questsApi } from '@/shared/api/quests'

export function useQuest() {
  const { activeQuests, completedQuests, startQuest, advanceQuest, completeQuest, hydrate } = useQuestStore()

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
    isActive,
    getStep,
    startQuest: (id: QuestId, step: QuestStep) => {
      startQuest(id, step)
      void questsApi.startQuest(id, step)
    },
    advanceQuest: (id: QuestId, step: QuestStep) => {
      advanceQuest(id, step)
      void questsApi.advanceQuest(id, step)
    },
    completeQuest: (id: QuestId) => {
      completeQuest(id)
      void questsApi.completeQuest(id)
    },
    hydrate,
  }
}


