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
  listVisible: async (args: { deviceId?: string; userId?: string }) =>
    convexClient.query(api.mapPoints.listVisible, args),
  listVisibleDebug: async (args: { deviceId?: string; userId?: string }) =>
    convexClient.query(api.mapPoints.listVisibleDebug as any, args),
  upsertManyDev: async (points: MapPointDTO[], devToken?: string) =>
    convexClient.mutation(api.mapPoints.upsertManyDev, {
      devToken: (devToken ?? ((import.meta as any).env.VITE_DEV_SEED_TOKEN as string)) ?? '',
      points,
    }),
}


