import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  WorldEvent,
  AnomalyZone,
  RaidEvent,
  ZoneChangeEvent,
  WorldEventType
} from './types'
import { eventBus } from '../../../shared/lib/events/eventBus'

interface WorldStore {
  // State
  activeEvents: WorldEvent[]
  anomalyZones: AnomalyZone[]
  raidEvents: RaidEvent[]
  zoneChanges: ZoneChangeEvent[]
  lastSyncAt: number

  // Actions
  loadWorldState: () => Promise<void>
  addEvent: (event: WorldEvent) => void
  updateEvent: (eventId: string, updates: Partial<WorldEvent>) => void
  removeEvent: (eventId: string) => void
  joinEvent: (eventId: string, playerId: string) => void
  leaveEvent: (eventId: string, playerId: string) => void

  // Anomaly management
  spawnAnomaly: (anomaly: Omit<AnomalyZone, 'id' | 'spawnTime' | 'isActive'>) => string
  despawnAnomaly: (anomalyId: string) => void
  getAnomaliesInArea: (lat: number, lng: number, radius: number) => AnomalyZone[]

  // Raid management
  startRaid: (raid: Omit<RaidEvent, 'id' | 'currentParticipants' | 'isActive'>) => string
  endRaid: (raidId: string) => void
  joinRaid: (raidId: string, playerId: string) => boolean
  leaveRaid: (raidId: string, playerId: string) => void

  // Zone changes
  applyZoneChange: (change: ZoneChangeEvent) => void
  revertZoneChange: (zoneId: string, changeType: string) => void

  // Selectors
  getActiveEvents: () => WorldEvent[]
  getEventsByType: (type: WorldEventType) => WorldEvent[]
  getEventsInArea: (lat: number, lng: number, radius: number) => WorldEvent[]
  getNearbyAnomalies: (playerLat: number, playerLng: number) => AnomalyZone[]
  getAvailableRaids: () => RaidEvent[]
  getPlayerActiveEvents: (playerId: string) => WorldEvent[]
}

export const useWorldStore = create<WorldStore>()(
  persist(
    (set, get) => ({
      activeEvents: [],
      anomalyZones: [],
      raidEvents: [],
      zoneChanges: [],
      lastSyncAt: 0,

      loadWorldState: async () => {
        try {
          // Здесь будет загрузка из Convex
          // const events = await getActiveWorldEvents()
          // const anomalies = await getActiveAnomalies()
          // const raids = await getActiveRaids()

          // set({ activeEvents: events, anomalyZones: anomalies, raidEvents: raids })
        } catch (error) {
          console.error('Failed to load world state:', error)
        }
      },

      addEvent: (event) => {
        set((state) => ({
          activeEvents: [...state.activeEvents, event],
        }))

        // Публикуем событие
        eventBus.publish({
          type: `world:${event.type}`,
          source: 'system',
          zoneId: event.zoneId,
          location: event.location,
          data: event,
        } as any)
      },

      updateEvent: (eventId, updates) => {
        set((state) => ({
          activeEvents: state.activeEvents.map(event =>
            event.id === eventId ? { ...event, ...updates } : event
          ),
        }))
      },

      removeEvent: (eventId) => {
        set((state) => ({
          activeEvents: state.activeEvents.filter(event => event.id !== eventId),
        }))
      },

      joinEvent: (eventId, playerId) => {
        set((state) => ({
          activeEvents: state.activeEvents.map(event =>
            event.id === eventId
              ? {
                  ...event,
                  participants: [
                    ...event.participants,
                    { playerId, joinTime: Date.now(), contribution: 0 }
                  ]
                }
              : event
          ),
        }))
      },

      leaveEvent: (eventId, playerId) => {
        set((state) => ({
          activeEvents: state.activeEvents.map(event =>
            event.id === eventId
              ? {
                  ...event,
                  participants: event.participants.filter(p => p.playerId !== playerId)
                }
              : event
          ),
        }))
      },

      spawnAnomaly: (anomaly) => {
        const id = `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newAnomaly: AnomalyZone = {
          ...anomaly,
          id,
          spawnTime: Date.now(),
          isActive: true,
        }

        set((state) => ({
          anomalyZones: [...state.anomalyZones, newAnomaly],
        }))

        // Публикуем событие спавна аномалии
        eventBus.publish({
          type: 'world:anomaly_spawn',
          source: 'system',
          location: anomaly.location,
          data: newAnomaly,
        } as any)

        return id
      },

      despawnAnomaly: (anomalyId) => {
        set((state) => ({
          anomalyZones: state.anomalyZones.filter(a => a.id !== anomalyId),
        }))

        // Публикуем событие деспавна
        eventBus.publish({
          type: 'world:anomaly_despawn',
          source: 'system',
          data: { anomalyId },
        } as any)
      },

      getAnomaliesInArea: (lat, lng, radius) => {
        const { anomalyZones } = get()
        return anomalyZones.filter(anomaly => {
          const distance = calculateDistance(
            lat, lng,
            anomaly.location.lat, anomaly.location.lng
          )
          return distance <= (anomaly.radius + radius)
        })
      },

      startRaid: (raid) => {
        const id = `raid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newRaid: RaidEvent = {
          ...raid,
          id,
          currentParticipants: 0,
          isActive: true,
        }

        set((state) => ({
          raidEvents: [...state.raidEvents, newRaid],
        }))

        // Публикуем событие начала рейда
        eventBus.publish({
          type: 'world:raid_start',
          source: 'system',
          location: raid.location,
          data: newRaid,
        } as any)

        return id
      },

      endRaid: (raidId) => {
        set((state) => ({
          raidEvents: state.raidEvents.filter(raid => raid.id !== raidId),
        }))

        // Публикуем событие окончания рейда
        eventBus.publish({
          type: 'world:raid_end',
          source: 'system',
          data: { raidId },
        } as any)
      },

      joinRaid: (raidId, playerId) => {
        const { raidEvents } = get()
        const raid = raidEvents.find(r => r.id === raidId)

        if (!raid || raid.currentParticipants >= raid.maxParticipants) {
          return false
        }

        set((state) => ({
          raidEvents: state.raidEvents.map(raid =>
            raid.id === raidId
              ? { ...raid, currentParticipants: raid.currentParticipants + 1 }
              : raid
          ),
        }))

        return true
      },

      leaveRaid: (raidId, playerId) => {
        set((state) => ({
          raidEvents: state.raidEvents.map(raid =>
            raid.id === raidId
              ? { ...raid, currentParticipants: Math.max(0, raid.currentParticipants - 1) }
              : raid
          ),
        }))
      },

      applyZoneChange: (change) => {
        set((state) => ({
          zoneChanges: [...state.zoneChanges, change],
        }))

        // Публикуем событие изменения зоны
        eventBus.publish({
          type: 'world:zone_change',
          source: 'system',
          zoneId: change.zoneId,
          data: change,
        } as any)
      },

      revertZoneChange: (zoneId, changeType) => {
        set((state) => ({
          zoneChanges: state.zoneChanges.filter(
            change => !(change.zoneId === zoneId && change.changeType === changeType)
          ),
        }))
      },

      // Selectors
      getActiveEvents: () => {
        const { activeEvents } = get()
        return activeEvents.filter(event => event.isActive)
      },

      getEventsByType: (type) => {
        const { activeEvents } = get()
        return activeEvents.filter(event => event.type === type)
      },

      getEventsInArea: (lat, lng, radius) => {
        const { activeEvents } = get()
        return activeEvents.filter(event => {
          if (!event.location) return false

          const distance = calculateDistance(
            lat, lng,
            event.location.lat, event.location.lng
          )
          return distance <= (event.location.radius || 0) + radius
        })
      },

      getNearbyAnomalies: (playerLat, playerLng) => {
        const { anomalyZones } = get()
        return anomalyZones.filter(anomaly => {
          const distance = calculateDistance(
            playerLat, playerLng,
            anomaly.location.lat, anomaly.location.lng
          )
          return distance <= anomaly.radius * 2 // В пределах двойного радиуса
        })
      },

      getAvailableRaids: () => {
        const { raidEvents } = get()
        return raidEvents.filter(raid => raid.isActive)
      },

      getPlayerActiveEvents: (playerId) => {
        const { activeEvents } = get()
        return activeEvents.filter(event =>
          event.participants.some(p => p.playerId === playerId)
        )
      },
    }),
    {
      name: 'grenzwanderer-world',
      partialize: (state) => ({
        activeEvents: state.activeEvents,
        anomalyZones: state.anomalyZones,
        raidEvents: state.raidEvents,
        zoneChanges: state.zoneChanges,
      }),
    }
  )
)

/**
 * Вычисляет расстояние между двумя координатами в метрах
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Радиус Земли в метрах
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
