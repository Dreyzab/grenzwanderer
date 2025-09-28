import type { QuestId, QuestStep, QuestEvent } from '../model/types'

function hashQuestEvent(event: QuestEvent): number {
  const parts = [
    event.type,
    event.questId,
    event.step ?? '',
    event.from ?? '',
    event.to ?? '',
    JSON.stringify(event.context ?? {}),
  ]

  let hash = 0
  for (const part of parts) {
    for (let i = 0; i < part.length; i += 1) {
      hash = (hash * 31 + part.charCodeAt(i)) >>> 0
    }
  }

  return hash
}

function resolveStartedAt(event: QuestEvent): number {
  if (typeof event.timestamp === 'number') {
    return event.timestamp
  }

  const contextCreatedAt =
    event.context && typeof event.context.createdAt === 'number'
      ? event.context.createdAt
      : null

  if (contextCreatedAt !== null) {
    return contextCreatedAt
  }

  return hashQuestEvent(event)
}

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
      const syntheticEvent: QuestEvent = {
        type: 'quest.started',
        questId: id,
        step: currentStep,
        context: { source },
      }

      events.push({
        ...syntheticEvent,
        timestamp: resolveStartedAt(syntheticEvent),
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
  const sortedEvents = [...events].sort((a, b) => {
    const aTimestamp = typeof a.timestamp === 'number' ? a.timestamp : hashQuestEvent(a)
    const bTimestamp = typeof b.timestamp === 'number' ? b.timestamp : hashQuestEvent(b)

    return aTimestamp - bTimestamp
  })

  for (const event of sortedEvents) {
    const { questId, type } = event

    switch (type) {
      case 'quest.started':
        if (!completedQuests.includes(questId)) {
          const startedAt = resolveStartedAt(event)

          activeQuests[questId] = {
            currentStep: event.step || 'started',
            startedAt,
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
