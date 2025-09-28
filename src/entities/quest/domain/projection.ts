import type { QuestId, QuestStep, QuestEvent } from '../model/types'

// Состояние квеста для проекции
interface QuestSnapshot {
  id: QuestId
  currentStep: QuestStep
  completedAt?: number
}

// Конвертация снапшота в события
export function snapshotToQuestEvents(
  snapshots: QuestSnapshot[],
  source: 'server' | 'local'
): QuestEvent[] {
  const events: QuestEvent[] = []

  for (const snapshot of snapshots) {
    const { id, currentStep, completedAt } = snapshot

    // Если квест завершен
    if (completedAt) {
      events.push({
        type: 'quest.completed',
        questId: id,
        step: currentStep,
        context: { source, completedAt },
        timestamp: completedAt,
      })
    } else if (currentStep !== 'not_started') {
      // Если квест активен
      events.push({
        type: 'quest.started',
        questId: id,
        step: currentStep,
        context: { source },
        timestamp: Date.now(), // Для активных квестов используем текущее время
      })
    }
  }

  return events
}

// Проекция событий в состояние квестов
export function projectQuestState(events: QuestEvent[]): {
  activeQuests: Record<QuestId, { currentStep: QuestStep; startedAt: number }>
  completedQuests: QuestId[]
} {
  const activeQuests: Record<QuestId, { currentStep: QuestStep; startedAt: number }> = {}
  const completedQuests: QuestId[] = []

  // Сортируем события по времени
  const sortedEvents = [...events].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))

  for (const event of sortedEvents) {
    const { questId, type } = event

    switch (type) {
      case 'quest.started':
        if (!completedQuests.includes(questId)) {
          activeQuests[questId] = {
            currentStep: event.step || 'started',
            startedAt: event.timestamp || Date.now(),
          }
        }
        break

      case 'quest.advanced':
        if (activeQuests[questId] && !completedQuests.includes(questId)) {
          activeQuests[questId].currentStep = event.to || 'started'
        }
        break

      case 'quest.completed':
        delete activeQuests[questId]
        if (!completedQuests.includes(questId)) {
          completedQuests.push(questId)
        }
        break
    }
  }

  return { activeQuests, completedQuests }
}
