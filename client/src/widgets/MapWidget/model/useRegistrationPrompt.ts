import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useQuest } from '@/entities/quest/model/useQuest'

export function useRegistrationPrompt() {
  const { isSignedIn } = useAuth()
  const [showRegistration, setShowRegistration] = useState(false)
  const quest = useQuest()

  useEffect(() => {
    // Показываем промпт после завершения стартового квеста, даже если ранее был отклонён
    const isCompleted = (quest.completedQuests ?? []).includes('delivery_and_dilemma' as any)
    if (!isSignedIn && isCompleted) {
      try { localStorage.removeItem('registration_prompt_dismissed') } catch {}
      setShowRegistration(true)
    }
  }, [isSignedIn, quest.completedQuests])

  // Позволяет внешнему коду скрыть модал до следующего «завершения» (без постоянного дисмиса)

  return { showRegistration, setShowRegistration }
}


