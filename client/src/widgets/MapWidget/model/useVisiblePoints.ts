import { useEffect, useRef, useState } from 'react'
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
  const hasSeededRef = useRef(false)

  const arePointsEqual = (a: VisibleMapPoint[], b: VisibleMapPoint[]) => {
    if (a === b) return true
    if (a.length !== b.length) return false
    // Быстрая проверка по id и основным полям
    const byIdA = new Map(a.map((p) => [p.id, p]))
    for (const bp of b) {
      const ap = byIdA.get(bp.id)
      if (!ap) return false
      if (
        ap.coordinates.lat !== bp.coordinates.lat ||
        ap.coordinates.lng !== bp.coordinates.lng ||
        ap.type !== bp.type ||
        ap.isActive !== bp.isActive ||
        ap.dialogKey !== bp.dialogKey ||
        ap.eventKey !== bp.eventKey ||
        ap.npcId !== bp.npcId ||
        ap.questId !== bp.questId ||
        // Доп. пользовательски заметные поля, чтобы гарантировать перерисовку при их изменении
        ap.factionId !== bp.factionId ||
        ap.title !== bp.title ||
        ap.description !== bp.description ||
        ap.icon !== bp.icon ||
        ap.radius !== bp.radius
      ) {
        return false
      }
    }
    return true
  }

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
            factionId: (sp as any).factionId ?? undefined,
            isDiscovered: true,
          })) as VisibleMapPoint[]
        }
      } catch (e) {
        logger.info('MAP', 'Convex map_points fetch failed, fallback to local', e)
      }

      if (import.meta.env.DEV) {
        if (!hasSeededRef.current) {
          // Ставим флаг до await, чтобы исключить гонки при быстрых повторных вызовах эффекта
          hasSeededRef.current = true
          await seedDemoMapPoints()
        }
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

      setPoints((prev) => {
        if (arePointsEqual(prev, stored)) return prev
        logger.info('MAP', 'Points total:', stored.length)
        return stored
      })
    })()
  }, [userId, bbox])

  return points
}


