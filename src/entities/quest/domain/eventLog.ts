import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { QuestEvent } from '../model/types'

// Состояние лога событий квестов
interface QuestEventLogState {
  events: QuestEvent[]
  addEvent: (event: QuestEvent) => void
  reset: (events: QuestEvent[]) => void
  getEventsByQuest: (questId: string) => QuestEvent[]
  getEventsByType: (type: QuestEvent['type']) => QuestEvent[]
  clear: () => void
}

// Создаем стор для лога событий квестов
export const useQuestEventLog = create<QuestEventLogState>()(
  persist(
    (set, get) => ({
      events: [],

      addEvent: (event: QuestEvent) =>
        set((state) => ({
          events: [...state.events, event].slice(-1000), // Ограничиваем 1000 событий
        })),

      reset: (events: QuestEvent[]) =>
        set(() => ({
          events,
        })),

      getEventsByQuest: (questId: string) =>
        get().events.filter((event) => event.questId === questId),

      getEventsByType: (type: QuestEvent['type']) =>
        get().events.filter((event) => event.type === type),

      clear: () =>
        set(() => ({
          events: [],
        })),
    }),
    {
      name: 'quest-event-log',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ events: state.events }),
    }
  )
)

// Функция для подписки на события и добавления их в лог
export function setupQuestEventLogging(): void {
  // Импортируем динамически, чтобы избежать циклических зависимостей
  import('./events').then(({ questEventBus }) => {
    questEventBus.subscribe((event) => {
      useQuestEventLog.getState().addEvent(event)
    })
  })
}
