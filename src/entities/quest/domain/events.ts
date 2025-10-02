import { useEffect } from 'react'
import type { QuestEvent, QuestId, QuestStep } from '../model/types'

// Event bus для квестовых событий
type QuestEventHandler = (event: QuestEvent) => void

class QuestEventBus {
  private listeners: Set<QuestEventHandler> = new Set()

  subscribe(handler: QuestEventHandler): () => void {
    this.listeners.add(handler)
    return () => this.listeners.delete(handler)
  }

  publish(event: QuestEvent | Omit<QuestEvent, 'timestamp'>): void {
    const enrichedEvent: QuestEvent = 'timestamp' in event
      ? (event as QuestEvent)
      : { ...(event as Omit<QuestEvent, 'timestamp'>), timestamp: Date.now() }

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
export function publishQuestEvent(event: Omit<QuestEvent, 'timestamp'> | QuestEvent): void {
  questEventBus.publish(event)
}

// Хук для подписки на события квестов
export function useQuestEventListener(handler: QuestEventHandler): void {
  useEffect(() => {
    const unsubscribe = questEventBus.subscribe(handler)
    return () => unsubscribe()
  }, [handler])
}
