import { api } from '../../../convex/_generated/api'
import { convexClient } from '@/shared/lib/convexClient'

export interface MapPointDTO {
  key: string
  title: string
  description?: string
  coordinates: { lat: number; lng: number }
  type?: string
  dialogKey?: string
  questId?: string
  active: boolean
  radius?: number
  icon?: string
}

export const mapPointsApiConvex = {
  listAll: async () => convexClient.query(api.mapPoints.listAll, {}),
  listVisible: async (args: { deviceId?: string; userId?: string }) =>
    convexClient.query(api.mapPoints.listVisible, args),
  upsertManyDev: async (points: MapPointDTO[]) =>
    convexClient.mutation(api.mapPoints.upsertManyDev, {
      devToken: (import.meta as any).env.VITE_DEV_SEED_TOKEN as string,
      points,
    }),
}


