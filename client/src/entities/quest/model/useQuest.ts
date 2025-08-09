import { useCallback } from 'react'
import { useQuestStore } from './questStore'
import type { DeliveryQuestId, DeliveryQuestStep } from './types'

export function useQuest() {
  const { activeQuests, completedQuests, startQuest, advanceQuest, completeQuest } = useQuestStore()

  const isActive = useCallback((id: DeliveryQuestId) => Boolean(activeQuests[id]), [activeQuests])
  const getStep = useCallback(
    (id: DeliveryQuestId): DeliveryQuestStep | 'not_started' => activeQuests[id]?.currentStep ?? 'not_started',
    [activeQuests],
  )

  return {
    activeQuests,
    completedQuests,
    isActive,
    getStep,
    startQuest,
    advanceQuest,
    completeQuest,
  }
}


