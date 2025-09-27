/**
 * Централизованная система событий для multiplayer и игровых событий
 */

export type EventType =
  // Игровые события
  | 'player:join'
  | 'player:leave'
  | 'player:move'
  | 'player:quest_complete'
  | 'player:combat_start'
  | 'player:combat_end'

  // Мировые события
  | 'world:anomaly_spawn'
  | 'world:anomaly_despawn'
  | 'world:zone_change'
  | 'world:raid_start'
  | 'world:raid_end'

  // Социальные события
  | 'social:player_nearby'
  | 'social:trade_request'
  | 'social:trade_accept'
  | 'social:trade_decline'
  | 'social:message'

  // Системные события
  | 'system:pwa_installed'
  | 'system:pwa_updated'
  | 'system:offline_mode'
  | 'system:online_mode'

export interface BaseEvent {
  id: string
  type: EventType
  timestamp: number
  source: string // deviceId или userId
}

export interface PlayerEvent extends BaseEvent {
  type: 'player:join' | 'player:leave' | 'player:move' | 'player:quest_complete' | 'player:combat_start' | 'player:combat_end'
  playerId: string
  data?: any
}

export interface WorldEvent extends BaseEvent {
  type: 'world:anomaly_spawn' | 'world:anomaly_despawn' | 'world:zone_change' | 'world:raid_start' | 'world:raid_end'
  zoneId?: string
  location?: { lat: number; lng: number }
  data?: any
}

export interface SocialEvent extends BaseEvent {
  type: 'social:player_nearby' | 'social:trade_request' | 'social:trade_accept' | 'social:trade_decline' | 'social:message'
  targetPlayerId?: string
  data?: any
}

export interface SystemEvent extends BaseEvent {
  type: 'system:pwa_installed' | 'system:pwa_updated' | 'system:offline_mode' | 'system:online_mode'
  data?: any
}

export type GameEvent = PlayerEvent | WorldEvent | SocialEvent | SystemEvent

/**
 * Слушатель событий
 */
export type EventListener<T extends GameEvent = GameEvent> = (event: T) => void | Promise<void>

/**
 * Фильтр событий
 */
export type EventFilter<T extends GameEvent = GameEvent> = (event: T) => boolean

/**
 * Централизованная шина событий
 */
class EventBus {
  private listeners: Map<EventType, Set<EventListener>> = new Map()
  private eventHistory: GameEvent[] = []
  private maxHistorySize = 1000

  /**
   * Подписаться на событие
   */
  subscribe<T extends GameEvent>(
    eventType: EventType,
    listener: EventListener<T>,
    filter?: EventFilter<T>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }

    const wrappedListener = async (event: GameEvent) => {
      if (filter && !filter(event as T)) return
      await listener(event as T)
    }

    this.listeners.get(eventType)!.add(wrappedListener)

    // Возвращаем функцию отписки
    return () => {
      this.listeners.get(eventType)?.delete(wrappedListener)
    }
  }

  /**
   * Отписаться от всех событий
   */
  unsubscribe(eventType: EventType, listener: EventListener): void {
    this.listeners.get(eventType)?.delete(listener)
  }

  /**
   * Опубликовать событие
   */
  async publish(event: Omit<GameEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: GameEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
    }

    // Добавляем в историю
    this.eventHistory.push(fullEvent)
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift()
    }

    // Вызываем слушателей
    const eventListeners = this.listeners.get(event.type)
    if (eventListeners) {
      const promises = Array.from(eventListeners).map(listener =>
        Promise.resolve(listener(fullEvent)).catch(error => {
          console.error('Event listener error:', error)
        })
      )
      await Promise.all(promises)
    }

    // Логируем событие
    console.log('Event published:', fullEvent)
  }

  /**
   * Получить историю событий
   */
  getEventHistory(filter?: EventFilter): GameEvent[] {
    if (!filter) return [...this.eventHistory]

    return this.eventHistory.filter(filter)
  }

  /**
   * Очистить историю событий
   */
  clearHistory(): void {
    this.eventHistory = []
  }

  /**
   * Получить статистику событий
   */
  getStats(): {
    totalEvents: number
    eventsByType: Record<EventType, number>
    recentEvents: number // за последний час
  } {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000

    const eventsByType: Record<EventType, number> = {} as Record<EventType, number>
    let recentEvents = 0

    this.eventHistory.forEach(event => {
      // Подсчет по типам
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1

      // Подсчет недавних событий
      if (event.timestamp > oneHourAgo) {
        recentEvents++
      }
    })

    return {
      totalEvents: this.eventHistory.length,
      eventsByType,
      recentEvents,
    }
  }

  /**
   * Проверить, активно ли событие
   */
  isEventActive(eventType: EventType): boolean {
    const recentEvents = this.getEventHistory(
      (event) => event.type === eventType && (Date.now() - event.timestamp) < 60000 // 1 минута
    )
    return recentEvents.length > 0
  }

  /**
   * Генерация уникального ID события
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Экспортируем singleton
export const eventBus = new EventBus()

/**
 * React хук для подписки на события
 */
export function useEventSubscription<T extends GameEvent>(
  eventType: EventType,
  listener: EventListener<T>,
  filter?: EventFilter<T>,
  deps: any[] = []
) {
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(eventType, listener, filter)
    return unsubscribe
  }, [eventType, ...deps])
}

/**
 * React хук для публикации событий
 */
export function useEventPublisher() {
  return useCallback((event: Omit<GameEvent, 'id' | 'timestamp'>) => {
    return eventBus.publish(event)
  }, [])
}

/**
 * React хук для получения истории событий
 */
export function useEventHistory(filter?: EventFilter, maxCount?: number) {
  const [history, setHistory] = useState<GameEvent[]>([])

  useEffect(() => {
    const updateHistory = () => {
      const events = eventBus.getEventHistory(filter)
      setHistory(maxCount ? events.slice(-maxCount) : events)
    }

    // Обновляем сразу
    updateHistory()

    // Подписываемся на новые события
    const unsubscribe = eventBus.subscribe('*' as EventType, updateHistory)

    return unsubscribe
  }, [filter, maxCount])

  return history
}

import { useEffect, useCallback, useState } from 'react'
