import { useEffect, useState } from 'react'
import type { VisibleMapPoint } from '@/entities/map-point/model/types'
import { mapPointsApi } from '@/shared/api/mapPoints'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import { useAuthStore } from '@/entities/auth/model/store'
import { seedDemoMapPoints } from '@/entities/map-point/api/seed'
import { mapPointApi } from '@/entities/map-point/api/local'
import logger from '@/shared/lib/logger'
// Принимаем опционально mapRef, чтобы слать bbox на сервер

export function useVisiblePoints(mapRef?: React.RefObject<any>) {
  const [points, setPoints] = useState<VisibleMapPoint[]>([])
  const { userId } = useAuthStore()
  const [bbox, setBbox] = useState<{ minLat: number; minLng: number; maxLat: number; maxLng: number } | undefined>(undefined)

  // Подписка на изменения карты и дебаунс обновления bbox
  useEffect(() => {
    if (!mapRef?.current) return
    let timer: any
    const update = () => {
      try {
        const b = mapRef.current.getBounds()
        setBbox({ minLat: b.getSouth(), minLng: b.getWest(), maxLat: b.getNorth(), maxLng: b.getEast() })
      } catch {}
    }
    const handler = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(update, 150)
    }
    mapRef.current.on('moveend', handler)
    mapRef.current.on('zoomend', handler)
    // начальная инициализация
    update()
    return () => {
      try { mapRef.current?.off('moveend', handler); mapRef.current?.off('zoomend', handler) } catch {}
      if (timer) clearTimeout(timer)
    }
  }, [mapRef?.current])
  

  useEffect(() => {
    ;(async () => {
      let stored: VisibleMapPoint[] = []
      try {
        const serverPoints = (await mapPointsApi.listVisible({
          deviceId: userId ? undefined : getOrCreateDeviceId(),
          userId: userId ?? undefined,
          // @ts-ignore — расширенный аргумент поддержан на сервере
          bbox,
        })) as any[]
        if (Array.isArray(serverPoints) && serverPoints.length > 0) {
          stored = serverPoints.map((sp) => ({
            id: sp.key,
            title: sp.title,
            description: sp.description ?? '',
            coordinates: sp.coordinates,
            type: sp.type ?? 'quest',
            isActive: sp.active,
            dialogKey: sp.dialogKey,
            eventKey: sp.eventKey,
            npcId: (sp as any).npcId,
            questId: sp.questId,
            radius: sp.radius ?? 0,
            icon: sp.icon ?? '',
            isDiscovered: true,
          })) as VisibleMapPoint[]
        }
      } catch (e) {
        logger.info('MAP', 'Convex map_points fetch failed, fallback to local', e)
      }

      if (import.meta.env.DEV) {
        await seedDemoMapPoints()
        const local = await mapPointApi.getPoints()
        const localVisible = local.map((p) => ({ ...p, isDiscovered: true })) as VisibleMapPoint[]
        if (stored.length === 0) {
          stored = localVisible
        } else {
          const byId = new Map(stored.map((p) => [p.id, p]))
          for (const lp of localVisible) if (!byId.has(lp.id)) byId.set(lp.id, lp)
          stored = Array.from(byId.values())
        }
      }

      logger.info('MAP', 'Points total:', stored.length)
      setPoints(stored)
    })()
  }, [userId, bbox])

  return points
}


