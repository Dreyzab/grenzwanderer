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
  listVisible: async (_args: { deviceId?: string; userId?: string }) => [] as any[],
  listVisibleDebug: async (_args: { deviceId?: string; userId?: string }) => ({ ok: true }),
  upsertManyDev: async (_points: MapPointDTO[], _devToken?: string) => ({ ok: true }),
  seedMapPointsDev: async (devToken: string) => convexClient.mutation((api as any).mapPoints.seedMapPointsDev, { devToken }),
  seedMappointBindingsDev: async (devToken: string) => convexClient.mutation((api as any).mapPoints.seedMappointBindingsDev, { devToken }),
}


