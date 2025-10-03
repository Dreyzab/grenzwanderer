import { useQuery, useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { useDeviceId } from '@/shared/hooks/useDeviceId'

// Hook to get visible map points
export function useVisibleMapPoints(options: {
  bbox?: {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  }
  phase?: number
  limit?: number
  enabled?: boolean
} = {}) {
  const { deviceId } = useDeviceId()
  const { bbox, phase, limit = 100, enabled = true } = options

  return useQuery(
    api.mapPoints.listVisible,
    enabled ? {
      deviceId,
      bbox,
      phase,
      limit,
    } : 'skip'
  )
}

// Hook to mark point as researched
export function useMarkResearched() {
  const { deviceId } = useDeviceId()
  const mutation = useMutation(api.mapPoints.markResearched)

  return async (pointKey: string) => {
    return await mutation({ deviceId, pointKey })
  }
}

// Hook to get points in radius
export function usePointsInRadius(options: {
  lat: number
  lng: number
  radiusKm?: number
  type?: 'poi' | 'quest' | 'npc' | 'location'
  phase?: number
  limit?: number
  enabled?: boolean
}) {
  const { lat, lng, radiusKm, type, phase, limit, enabled = true } = options

  return useQuery(
    api.mapPoints.getPointsInRadius,
    enabled ? {
      lat,
      lng,
      radiusKm,
      type,
      phase,
      limit,
    } : 'skip'
  )
}

// Hook to get discovery statistics
export function useDiscoveryStats() {
  const { deviceId } = useDeviceId()

  return useQuery(api.mapPoints.getDiscoveryStats, {
    deviceId,
  })
}

// Hook to seed map points
export function useSeedMapPoints() {
  return useMutation(api.mapPointsSeed.seedMapPoints)
}

// Hook to clear map points
export function useClearMapPoints() {
  return useMutation(api.mapPointsSeed.clearMapPoints)
}
