import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface POIStatus {
  key: string
  status: 'not_found' | 'discovered' | 'researched'
  discoveredAt?: number
  researchedAt?: number
  discoveredBy?: string // deviceId or userId
  researchMethod?: 'qr_scan' | 'proximity' | 'manual'
  researchData?: any // Дополнительные данные исследования
}

interface POIStatusStore {
  // State
  statuses: Record<string, POIStatus>
  lastSyncAt: number

  // Actions
  setStatus: (key: string, status: POIStatus) => void
  markDiscovered: (key: string, method?: POIStatus['researchMethod']) => void
  markResearched: (key: string, method?: POIStatus['researchMethod'], data?: any) => void
  getStatus: (key: string) => POIStatus | null
  getAllStatuses: () => Record<string, POIStatus>
  getStatusesByStatus: (status: POIStatus['status']) => POIStatus[]
  syncWithServer: (serverStatuses: Record<string, POIStatus>) => void

  // Selectors
  getDiscoveredCount: () => number
  getResearchedCount: () => number
  getTotalCount: () => number
}

export const usePOIStatusStore = create<POIStatusStore>()(
  persist(
    (set, get) => ({
      statuses: {},
      lastSyncAt: 0,

      setStatus: (key, status) => {
        set((state) => ({
          statuses: {
            ...state.statuses,
            [key]: status,
          },
        }))
      },

      markDiscovered: (key, method = 'proximity') => {
        const existing = get().getStatus(key)
        const now = Date.now()

        const status: POIStatus = {
          key,
          status: 'discovered',
          discoveredAt: now,
          discoveredBy: 'current_device', // TODO: get actual device ID
          researchMethod: method,
        }

        // Сохраняем только если статус улучшился
        if (!existing || existing.status === 'not_found') {
          set((state) => ({
            statuses: {
              ...state.statuses,
              [key]: status,
            },
          }))
        }
      },

      markResearched: (key, method = 'qr_scan', data) => {
        const existing = get().getStatus(key)
        const now = Date.now()

        const status: POIStatus = {
          key,
          status: 'researched',
          discoveredAt: existing?.discoveredAt || now,
          researchedAt: now,
          discoveredBy: existing?.discoveredBy || 'current_device',
          researchMethod: method,
          researchData: data,
        }

        set((state) => ({
          statuses: {
            ...state.statuses,
            [key]: status,
          },
        }))
      },

      getStatus: (key) => {
        return get().statuses[key] || null
      },

      getAllStatuses: () => {
        return get().statuses
      },

      getStatusesByStatus: (status) => {
        return Object.values(get().statuses).filter(s => s.status === status)
      },

      syncWithServer: (serverStatuses) => {
        set((state) => ({
          statuses: {
            ...state.statuses,
            ...serverStatuses,
          },
          lastSyncAt: Date.now(),
        }))
      },

      getDiscoveredCount: () => {
        return get().getStatusesByStatus('discovered').length
      },

      getResearchedCount: () => {
        return get().getStatusesByStatus('researched').length
      },

      getTotalCount: () => {
        return Object.keys(get().statuses).length
      },
    }),
    {
      name: 'grenzwanderer-poi-statuses',
      partialize: (state) => ({
        statuses: state.statuses,
      }),
    }
  )
)
