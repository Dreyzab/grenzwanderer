import { useEffect, useState } from 'react'
import { useQuest } from '@/entities/quest/model/useQuest'
import { useAuthStore } from '@/entities/auth/model/store'

export function useRegistrationPrompt() {
  const quest = useQuest()
  const { userId } = useAuthStore()
  const [showRegistration, setShowRegistration] = useState(false)

  useEffect(() => {
    const delivered = quest.getStep('delivery_and_dilemma') === 'completed'
    if (delivered && !userId) setShowRegistration(true)
    if (!delivered && !userId) setShowRegistration(false)
  }, [quest.activeQuests, quest.completedQuests, userId])

  return { showRegistration, setShowRegistration }
}


