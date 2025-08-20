import { useEffect, useMemo, useState } from 'react'
import type { VisibleMapPoint } from '@/entities/map-point/model/types'
import { mapPointsApiConvex } from '@/shared/api/mapPoints/convex'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import logger from '@/shared/lib/logger'

export function useVisiblePoints(mapRef: React.RefObject<unknown>) {
  const [points, setPoints] = useState<VisibleMapPoint[]>([])

  const bbox = useMemo(() => {
    const m = mapRef.current as any
    if (!m) return null
    const bounds = m.getBounds()
    return bounds
      ? { minLat: bounds.getSouth(), minLng: bounds.getWest(), maxLat: bounds.getNorth(), maxLng: bounds.getEast() }
      : null
  }, [mapRef])

  useEffect(() => {
    const m = mapRef.current as any
    if (!m) return
    const deviceId = getOrCreateDeviceId()
    let raf: number | null = null

    const load = async () => {
      try {
        const res = await mapPointsApiConvex.listVisible({ deviceId })
        setPoints(res as any)
        logger.info('MAP', 'Points total:', (res as any[]).length)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load visible points', e)
      }
    }

    const schedule = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => void load())
    }

    schedule()
    const onMoveEnd = () => schedule()
    m.on('moveend', onMoveEnd)
    m.on('zoomend', onMoveEnd)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      try { m.off('moveend', onMoveEnd) } catch {}
      try { m.off('zoomend', onMoveEnd) } catch {}
    }
  }, [mapRef, bbox?.minLat, bbox?.minLng, bbox?.maxLat, bbox?.maxLng])

  return points
}


