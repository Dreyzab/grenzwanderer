import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useQuest } from '@/entities/quest/model/useQuest'
import logger from '@/shared/lib/logger'

export function useRegistrationPrompt() {
  const { isSignedIn } = useAuth()
  const [showRegistration, setShowRegistration] = useState(false)
  const quest = useQuest()

  useEffect(() => {
    // Показываем промпт после завершения стартового квеста, даже если ранее был отклонён
    const isCompleted = (quest.completedQuests ?? []).includes('delivery_and_dilemma' as any)
    logger.info('STORE', 'regPrompt: check', { isSignedIn, isCompleted, completedQuests: quest.completedQuests })
    if (typeof isSignedIn === 'undefined') {
      logger.info('STORE', 'regPrompt: clerk pending, skip')
      return
    }
    if (isSignedIn === false && isCompleted) {
      try { localStorage.removeItem('registration_prompt_dismissed') } catch {}
      setShowRegistration(true)
      logger.info('STORE', 'regPrompt: open')
    } else {
      setShowRegistration(false)
      logger.info('STORE', 'regPrompt: skip/close')
    }
  }, [isSignedIn, quest.completedQuests])

  // Позволяет внешнему коду скрыть модал до следующего «завершения» (без постоянного дисмиса)

  return { showRegistration, setShowRegistration }
}


