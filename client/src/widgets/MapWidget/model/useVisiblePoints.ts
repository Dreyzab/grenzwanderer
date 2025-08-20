import { useEffect, useMemo, useRef, useState } from 'react'
import type { VisibleMapPoint } from '@/entities/map-point/model/types'
import { mapPointsApiConvex } from '@/shared/api/mapPoints/convex'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import logger from '@/shared/lib/logger'

export function useVisiblePoints(mapRef: React.RefObject<unknown>) {
  const [points, setPoints] = useState<VisibleMapPoint[]>([])
  const isLoadingRef = useRef(false as boolean)
  const lastLoadedAtRef = useRef(0 as number)

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
        const now = Date.now()
        if (isLoadingRef.current) return
        if (now - lastLoadedAtRef.current < 1500) return
        isLoadingRef.current = true
        const args = bbox
          ? { deviceId, userId: undefined as any, bbox }
          : { deviceId }
        const res = (await mapPointsApiConvex.listVisible(args as any)) as any[]
        const mapped: VisibleMapPoint[] = res.map((r: any) => ({
          id: r.key,
          title: r.title,
          description: r.description,
          coordinates: r.coordinates,
          type: (r.type ?? 'landmark') as any,
          isActive: Boolean(r.active ?? true),
          dialogKey: r.dialogKey ?? undefined,
          eventKey: (r as any).eventKey ?? undefined,
          npcId: r.npcId ?? undefined,
          radius: r.radius ?? 0,
          icon: r.icon ?? undefined,
          isDiscovered: true,
        }))
        setPoints(mapped)
        lastLoadedAtRef.current = now
        logger.info('MAP', 'Visible bbox:', bbox, 'Points total:', mapped.length)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load visible points', e)
      } finally {
        isLoadingRef.current = false
      }
    }

    const schedule = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => void load())
    }

    // Первичная загрузка не чаще чем раз в 1.5с, чтобы избежать бурста после монтирования
    const first = setTimeout(schedule, 500)
    const onMoveEnd = () => schedule()
    m.on('moveend', onMoveEnd)
    m.on('zoomend', onMoveEnd)
    return () => {
      if (first) clearTimeout(first)
      if (raf) cancelAnimationFrame(raf)
      try { m.off('moveend', onMoveEnd) } catch {}
      try { m.off('zoomend', onMoveEnd) } catch {}
    }
  }, [mapRef, bbox?.minLat, bbox?.minLng, bbox?.maxLat, bbox?.maxLng])

  return points
}


