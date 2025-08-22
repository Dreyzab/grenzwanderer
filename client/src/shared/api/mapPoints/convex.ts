// Convex removed: keep only dev seed call if available at build time
import { api } from '../../../../convex/_generated/api'
import { convexClient } from '@/shared/lib/convexClient'
import type { MapPointType } from '@/shared/constants'

export interface MapPointDTO {
  key: string
  title: string
  description?: string
  coordinates: { lat: number; lng: number }
  type?: MapPointType
  dialogKey?: string
  questId?: string
  active: boolean
  radius?: number
  icon?: string
}

export const mapPointsApiConvex = {
  // no runtime fetching in client-authoritative mode
  listVisible: async (_args: { deviceId?: string; userId?: string }): Promise<MapPointDTO[]> => [],
  listVisibleDebug: async (_args: { deviceId?: string; userId?: string }): Promise<{ ok: true }> => ({ ok: true }),
  upsertManyDev: async (_points: MapPointDTO[], _devToken?: string): Promise<{ ok: boolean }> => ({ ok: true }),
  seedMapPointsDev: async (devToken: string): Promise<{ ok: boolean; count?: number }> => {
    const mod = (api as any)?.mapPoints
    if (!convexClient?.mutation || !mod?.seedMapPointsDev) throw new Error('seedMapPointsDev mutation not available in this build')
    return convexClient.mutation(mod.seedMapPointsDev, { devToken }) as any
  },
  seedMappointBindingsDev: async (devToken: string): Promise<{ ok: boolean; count?: number }> => {
    const mod = (api as any)?.mapPoints
    if (!convexClient?.mutation || !mod?.seedMappointBindingsDev) throw new Error('seedMappointBindingsDev mutation not available in this build')
    return convexClient.mutation(mod.seedMappointBindingsDev, { devToken }) as any
  },
}


