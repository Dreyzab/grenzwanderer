import { useCallback } from 'react'
import { useQuestStore } from './questStore'
import type { DeliveryQuestId, DeliveryQuestStep } from './types'
import { questsApi } from '@/shared/api/quests'

export function useQuest() {
  const { activeQuests, completedQuests, startQuest, advanceQuest, completeQuest, hydrate } = useQuestStore()

  const isActive = useCallback((id: DeliveryQuestId) => Boolean(activeQuests[id]), [activeQuests])
  const getStep = useCallback(
    (id: DeliveryQuestId): DeliveryQuestStep | 'not_started' => {
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
    startQuest: (id: DeliveryQuestId, step: DeliveryQuestStep) => {
      startQuest(id, step)
      void questsApi.startQuest(id, step)
    },
    advanceQuest: (id: DeliveryQuestId, step: DeliveryQuestStep) => {
      advanceQuest(id, step)
      void questsApi.advanceQuest(id, step)
    },
    completeQuest: (id: DeliveryQuestId) => {
      completeQuest(id)
      void questsApi.completeQuest(id)
    },
    hydrate,
  }
}


