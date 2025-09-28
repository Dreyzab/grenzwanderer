import type { QuestEvent, QuestId, QuestStep } from '../model/types'

// Event bus для квестовых событий
type QuestEventHandler = (event: QuestEvent) => void

class QuestEventBus {
  private listeners: Set<QuestEventHandler> = new Set()

  subscribe(handler: QuestEventHandler): () => void {
    this.listeners.add(handler)
    return () => this.listeners.delete(handler)
  }

  publish(event: QuestEvent): void {
    const enrichedEvent = {
      ...event,
      timestamp: Date.now(),
    }

    this.listeners.forEach(handler => {
      try {
        handler(enrichedEvent)
      } catch (error) {
        console.error('[QuestEvents] Handler error:', error)
      }
    })
  }
}

export const questEventBus = new QuestEventBus()

// Функция для публикации событий квестов
export function publishQuestEvent(event: Omit<QuestEvent, 'timestamp'>): void {
  questEventBus.publish(event as QuestEvent)
}

// Хук для подписки на события квестов
export function useQuestEventListener(handler: QuestEventHandler): void {
  // В React окружении это будет React хук
  // Пока просто подписываемся
  return questEventBus.subscribe(handler) as any
}
