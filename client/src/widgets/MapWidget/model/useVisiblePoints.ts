import { useEffect, useRef, useState } from 'react'
import type { Map } from 'mapbox-gl'
import { mapPointsApi } from '@/shared/api/mapPoints'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import logger from '@/shared/lib/logger'

import type { MapPointType } from '@/shared/constants'

export interface VisibleMapPoint {
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

export function useVisiblePoints(mapRef: React.RefObject<Map | null>) {
  const [points, setPoints] = useState<VisibleMapPoint[]>([])
  const isLoadingRef = useRef(false)
  const lastLoadedAtRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const destroyedRef = useRef(false)

  useEffect(() => {
    destroyedRef.current = false
    const map = mapRef.current
    if (!map) return

    const scheduleLoad = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(async () => {
        rafRef.current = null
        if (isLoadingRef.current) return
        const now = Date.now()
        if (now - lastLoadedAtRef.current < 1500) return
        isLoadingRef.current = true
        try {
          const deviceId = getOrCreateDeviceId()
          const result = await mapPointsApi.listVisible({ deviceId })
          try { logger.info('MAP', 'visible points loaded', { count: (result as any)?.length ?? 0, keys: (result as any)?.map((p: any) => p.key) }) } catch (_e) {}
          if (!destroyedRef.current) setPoints(result as any)
        } catch (e) {
          logger.warn?.('MAP', 'visible points load failed')
        } finally {
          if (!destroyedRef.current) lastLoadedAtRef.current = Date.now()
          isLoadingRef.current = false
        }
      })
    }

    const onMoveEnd = () => scheduleLoad()
    const onZoomEnd = () => scheduleLoad()
    map.on('moveend', onMoveEnd)
    map.on('zoomend', onZoomEnd)

    // начальная загрузка
    scheduleLoad()

    return () => {
      destroyedRef.current = true
      try {
        map.off('moveend', onMoveEnd)
        map.off('zoomend', onZoomEnd)
      } catch {}
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [mapRef])

  return points
}


