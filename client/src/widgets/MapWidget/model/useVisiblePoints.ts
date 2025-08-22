import { useEffect, useRef, useState } from 'react'
import type { Map } from 'mapbox-gl'
import { useGameDataStore } from '@/app/ConvexProvider'
import logger from '@/shared/lib/logger'
import { useQuestStore } from '@/entities/quest/model/questStore'

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
  const mappointBindings = useGameDataStore((s) => s.mappointBindings)
  const mapPointsData = useGameDataStore((s) => s.mapPoints)
  const activeQuests = useQuestStore((s) => s.activeQuests)
  const isLoadingRef = useRef(false)
  const lastLoadedAtRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const destroyedRef = useRef(false)

  useEffect(() => {
    destroyedRef.current = false
    const map = mapRef.current
    if (!map) return

    logger.info('MAP', 'visible:init', { hasMap: Boolean(map), lastLoadedAt: lastLoadedAtRef.current })

    const scheduleLoad = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(async () => {
        rafRef.current = null
        if (isLoadingRef.current) return
        const now = Date.now()
        if (now - lastLoadedAtRef.current < 1500) return
        isLoadingRef.current = true
        try {
          // Определяем текущий активный квест и шаг
          const active = Object.values(activeQuests ?? {})[0] as any | undefined
          const activeQuestId = active?.id as string | undefined
          const activeStep = active?.currentStep as string | undefined

          // Клиент-авторитетный режим: используем локальные биндинги и точки
          // Фильтруем биндинги: если квест не начат — показываем только стартовые
          // если квест активен — показываем биндинги для текущего шага
          const filteredBindings = (mappointBindings ?? []).filter((b: any) => {
            if (!activeQuestId || !activeStep) return Boolean(b.isStart)
            if (b.questId !== activeQuestId) return false
            if (b.stepKey) return b.stepKey === activeStep
            return false
          })

          const result = filteredBindings
            .map((b: any) => {
              const p = (mapPointsData as any)?.find((x: any) => x.key === b.pointKey)
              if (!p) return null
              // Приоритет dialogKey из биндинга, если указан
              const dialogKey = (b as any).dialogKey ?? (p as any).dialogKey
              return { ...p, dialogKey }
            })
            .filter(Boolean)
          try {
            logger.info('MAP', 'visible:loaded', {
              count: (result as any).length ?? 0,
              keys: (result as any).map((p: any) => (p as any).key),
            })
          } catch (_e) {}
          if (!destroyedRef.current) setPoints(result as any)
        } catch (e) {
          logger.warn?.('MAP', 'visible:load_failed', e)
        } finally {
          if (!destroyedRef.current) lastLoadedAtRef.current = Date.now()
          isLoadingRef.current = false
        }
      })
    }

    const onMoveEnd = () => scheduleLoad()
    const onZoomEnd = () => scheduleLoad()
    map.once('load', () => {
      logger.info('MAP', 'visible:map_loaded')
      scheduleLoad()
    })
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
      logger.info('MAP', 'visible:cleanup')
    }
  }, [mapRef, mappointBindings, mapPointsData, activeQuests])

  // Немедленная реакция на изменение стора (без ожидания событий карты)
  useEffect(() => {
    const result = (mappointBindings ?? [])
      .map((b: any) => {
        const p = (mapPointsData as any)?.find((x: any) => x.key === b.pointKey)
        if (!p) return null
        const dialogKey = (b as any).dialogKey ?? (p as any).dialogKey
        return { ...p, dialogKey }
      })
      .filter(Boolean) as VisibleMapPoint[]
    try {
      logger.info('MAP', 'visible:loaded', { count: result.length, keys: result.map((p) => p.key) })
    } catch {}
    setPoints(result)
    // сбросим таймер для следующей ленивой загрузки по карте
    lastLoadedAtRef.current = 0
  }, [mappointBindings, mapPointsData, activeQuests])

  return points
}


