import { api } from '../../../../convex/_generated/api'
import { convexClient } from '@/shared/lib/convexClient'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'

export const qrApiConvex = {
  resolvePoint: async (code: string) => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.query(api.qr.resolvePoint, { code, deviceId }) as Promise<
      | { status: 'not_found' }
      | { status: 'point_inactive' }
      | {
          status: 'ok'
          point: { key: string; title: string; dialogKey?: string; questId?: string; coordinates: { lat: number; lng: number } }
          hasPda: boolean
          nextAction: 'start_intro_vn' | 'open_point'
        }
    >
  },
  grantPda: async () => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.mutation(api.qr.grantPda, { deviceId })
  },
}


