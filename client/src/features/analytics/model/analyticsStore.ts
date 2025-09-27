import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AnalyticsEvent {
  id: string
  type: AnalyticsEventType
  userId: string
  sessionId: string
  data: Record<string, any>
  timestamp: number
}

export type AnalyticsEventType =
  | 'session_start'
  | 'session_end'
  | 'level_up'
  | 'quest_start'
  | 'quest_complete'
  | 'quest_fail'
  | 'combat_start'
  | 'combat_end'
  | 'combat_victory'
  | 'combat_defeat'
  | 'item_found'
  | 'item_used'
  | 'location_visit'
  | 'social_interaction'
  | 'pwa_install'
  | 'feature_use'

interface SessionData {
  sessionId: string
  userId: string
  startTime: number
  endTime?: number
  duration: number
  events: AnalyticsEvent[]
  location?: {
    lat: number
    lng: number
  }
}

interface PlayerMetrics {
  userId: string
  totalPlayTime: number
  sessionsCount: number
  averageSessionDuration: number
  questsCompleted: number
  questsFailed: number
  combatWins: number
  combatLosses: number
  itemsFound: number
  locationsVisited: number
  socialInteractions: number
  level: number
  experience: number
  lastActive: number
}

interface GameMetrics {
  totalPlayers: number
  activePlayers: number
  totalSessions: number
  averageSessionDuration: number
  questCompletionRate: number
  combatWinRate: number
  retentionRate: {
    day1: number
    day7: number
    day30: number
  }
  popularFeatures: string[]
  problemAreas: string[]
}

interface AnalyticsStore {
  // State
  events: AnalyticsEvent[]
  sessions: Record<string, SessionData>
  playerMetrics: Record<string, PlayerMetrics>
  gameMetrics: GameMetrics
  lastSync: number

  // Actions
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) => void
  startSession: (userId: string, sessionId: string) => void
  endSession: (sessionId: string) => void
  updatePlayerMetrics: (userId: string, updates: Partial<PlayerMetrics>) => void
  updateGameMetrics: (updates: Partial<GameMetrics>) => void

  // Analytics queries
  getPlayerMetrics: (userId: string) => PlayerMetrics | null
  getSessionData: (sessionId: string) => SessionData | null
  getEventsByType: (type: AnalyticsEventType, limit?: number) => AnalyticsEvent[]
  getEventsByUser: (userId: string, limit?: number) => AnalyticsEvent[]
  getEventsByDateRange: (startDate: Date, endDate: Date) => AnalyticsEvent[]

  // Insights
  getPlayerRetention: (days: number) => number
  getFeatureUsage: (feature: string) => number
  getConversionFunnel: (steps: string[]) => Record<string, number>
  getPlayerBehavior: (userId: string) => any

  // Data management
  exportData: (format: 'json' | 'csv') => string
  clearOldData: (daysToKeep: number) => void
  syncWithServer: () => Promise<void>
}

export const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set, get) => ({
      events: [],
      sessions: {},
      playerMetrics: {},
      gameMetrics: {
        totalPlayers: 0,
        activePlayers: 0,
        totalSessions: 0,
        averageSessionDuration: 0,
        questCompletionRate: 0,
        combatWinRate: 0,
        retentionRate: { day1: 0, day7: 0, day30: 0 },
        popularFeatures: [],
        problemAreas: [],
      },
      lastSync: 0,

      trackEvent: (eventData) => {
        const event: AnalyticsEvent = {
          ...eventData,
          id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        }

        set((state) => ({
          events: [...state.events.slice(-999), event], // Храним последние 1000 событий
        }))

        // Обновляем метрики в зависимости от типа события
        switch (event.type) {
          case 'session_start':
            get().updateGameMetrics({ totalSessions: get().gameMetrics.totalSessions + 1 })
            break
          case 'quest_complete':
            get().updateGameMetrics({ questCompletionRate: get().gameMetrics.questCompletionRate + 1 })
            break
          case 'combat_victory':
            get().updateGameMetrics({ combatWinRate: get().gameMetrics.combatWinRate + 1 })
            break
        }
      },

      startSession: (userId, sessionId) => {
        const session: SessionData = {
          sessionId,
          userId,
          startTime: Date.now(),
          duration: 0,
          events: [],
        }

        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: session,
          },
        }))

        get().trackEvent({
          type: 'session_start',
          userId,
          sessionId,
          data: {},
        })
      },

      endSession: (sessionId) => {
        const session = get().sessions[sessionId]
        if (!session || session.endTime) return

        const endTime = Date.now()
        const duration = endTime - session.startTime

        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...session,
              endTime,
              duration,
            },
          },
        }))

        get().trackEvent({
          type: 'session_end',
          userId: session.userId,
          sessionId,
          data: { duration },
        })

        // Обновляем метрики игрока
        get().updatePlayerMetrics(session.userId, {
          totalPlayTime: get().playerMetrics[session.userId]?.totalPlayTime + duration || duration,
          sessionsCount: (get().playerMetrics[session.userId]?.sessionsCount || 0) + 1,
          averageSessionDuration: duration,
          lastActive: endTime,
        })
      },

      updatePlayerMetrics: (userId, updates) => {
        set((state) => ({
          playerMetrics: {
            ...state.playerMetrics,
            [userId]: {
              ...state.playerMetrics[userId],
              ...updates,
            },
          },
        }))
      },

      updateGameMetrics: (updates) => {
        set((state) => ({
          gameMetrics: {
            ...state.gameMetrics,
            ...updates,
          },
        }))
      },

      getPlayerMetrics: (userId) => {
        return get().playerMetrics[userId] || null
      },

      getSessionData: (sessionId) => {
        return get().sessions[sessionId] || null
      },

      getEventsByType: (type, limit = 100) => {
        const { events } = get()
        return events
          .filter(event => event.type === type)
          .slice(-limit)
      },

      getEventsByUser: (userId, limit = 100) => {
        const { events } = get()
        return events
          .filter(event => event.userId === userId)
          .slice(-limit)
      },

      getEventsByDateRange: (startDate, endDate) => {
        const { events } = get()
        const startTime = startDate.getTime()
        const endTime = endDate.getTime()

        return events.filter(event =>
          event.timestamp >= startTime && event.timestamp <= endTime
        )
      },

      getPlayerRetention: (days) => {
        const { events } = get()
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000)

        const recentPlayers = new Set(
          events
            .filter(event => event.timestamp >= cutoffTime)
            .map(event => event.userId)
        )

        const olderPlayers = new Set(
          events
            .filter(event => event.timestamp < cutoffTime)
            .map(event => event.userId)
        )

        const retainedPlayers = new Set(
          [...recentPlayers].filter(player => olderPlayers.has(player))
        )

        return recentPlayers.size > 0 ? (retainedPlayers.size / recentPlayers.size) * 100 : 0
      },

      getFeatureUsage: (feature) => {
        const { events } = get()
        return events.filter(event =>
          event.type === 'feature_use' && event.data?.feature === feature
        ).length
      },

      getConversionFunnel: (steps) => {
        const { events } = get()
        const funnel: Record<string, number> = {}

        steps.forEach((step, index) => {
          const stepEvents = events.filter(event =>
            event.type === 'feature_use' && event.data?.step === step
          )
          funnel[step] = stepEvents.length

          // Добавляем конверсию между шагами
          if (index > 0) {
            const prevStepEvents = events.filter(event =>
              event.type === 'feature_use' && event.data?.step === steps[index - 1]
            )
            funnel[`${steps[index - 1]}_to_${step}`] = prevStepEvents.length > 0
              ? (stepEvents.length / prevStepEvents.length) * 100
              : 0
          }
        })

        return funnel
      },

      getPlayerBehavior: (userId) => {
        const { events } = get()
        const userEvents = events.filter(event => event.userId === userId)

        return {
          totalEvents: userEvents.length,
          eventsByType: userEvents.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          averageSessionDuration: get().playerMetrics[userId]?.averageSessionDuration || 0,
          mostUsedFeatures: Object.entries(
            userEvents
              .filter(e => e.type === 'feature_use')
              .reduce((acc, event) => {
                const feature = event.data?.feature || 'unknown'
                acc[feature] = (acc[feature] || 0) + 1
                return acc
              }, {} as Record<string, number>)
          )
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([feature]) => feature),
        }
      },

      exportData: (format) => {
        const { events, sessions, playerMetrics, gameMetrics } = get()
        const data = {
          events,
          sessions: Object.values(sessions),
          playerMetrics: Object.values(playerMetrics),
          gameMetrics,
          exportedAt: Date.now(),
        }

        if (format === 'json') {
          return JSON.stringify(data, null, 2)
        } else {
          // CSV экспорт (упрощенный)
          const csvData = events.map(event =>
            `${event.id},${event.type},${event.userId},${event.timestamp},${JSON.stringify(event.data)}`
          ).join('\n')

          return `id,type,userId,timestamp,data\n${csvData}`
        }
      },

      clearOldData: (daysToKeep) => {
        const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)

        set((state) => ({
          events: state.events.filter(event => event.timestamp >= cutoffTime),
          sessions: Object.fromEntries(
            Object.entries(state.sessions).filter(([, session]) =>
              session.startTime >= cutoffTime
            )
          ),
        }))
      },

      syncWithServer: async () => {
        try {
          // Здесь будет синхронизация с сервером аналитики
          // const response = await fetch('/api/analytics/sync', {
          //   method: 'POST',
          //   body: JSON.stringify(get().exportData('json'))
          // })

          set({ lastSync: Date.now() })
        } catch (error) {
          console.error('Analytics sync failed:', error)
        }
      },
    }),
    {
      name: 'grenzwanderer-analytics',
      partialize: (state) => ({
        events: state.events.slice(-100), // Храним только последние 100 событий
        playerMetrics: state.playerMetrics,
        gameMetrics: state.gameMetrics,
      }),
    }
  )
)
