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
          // Фильтруем биндинги безопасно с проверками типов
          type Binding = { pointKey: string; questId?: string; stepKey?: string; isStart?: boolean; dialogKey?: string }
          const list = Array.isArray(mappointBindings) ? (mappointBindings as Binding[]) : []
          const filteredBindings = list.filter((b) => {
            if (!b || typeof b.pointKey !== 'string') return false
            if (!activeQuestId || !activeStep) return Boolean(b.isStart)
            if (b.questId !== activeQuestId) return false
            return typeof b.stepKey === 'string' && b.stepKey === activeStep
          })

          type Point = VisibleMapPoint & { key: string; dialogKey?: string }
          const pointsArr: Point[] = Array.isArray(mapPointsData) ? (mapPointsData as Point[]) : []
          const result = filteredBindings
            .map((b) => {
              const p = pointsArr.find((x) => x?.key === b.pointKey)
              if (!p) return null
              const dialogKey = (typeof b.dialogKey === 'string' ? b.dialogKey : undefined) ?? p.dialogKey
              const merged: Point = typeof dialogKey === 'string' ? { ...p, dialogKey } : p
              return merged
            })
            .filter((x): x is Point => x !== null)
          try {
            logger.info('MAP', 'visible:loaded', {
              count: (result as any).length ?? 0,
              keys: (result as any).map((p: any) => (p as any).key),
            })
          } catch (_e) {}
          if (!destroyedRef.current) setPoints(result as VisibleMapPoint[])
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

  // Немедленная реакция на изменение стора (без ожидания событий карты) — используем тот же pipeline
  useEffect(() => {
    type Binding = { pointKey: string; questId?: string; stepKey?: string; isStart?: boolean; dialogKey?: string }
    type Point = VisibleMapPoint & { key: string; dialogKey?: string }
    const list = Array.isArray(mappointBindings) ? (mappointBindings as Binding[]) : []
    const pointsArr: Point[] = Array.isArray(mapPointsData) ? (mapPointsData as Point[]) : []

    const active = Object.values(activeQuests ?? {})[0] as { id?: string; currentStep?: string } | undefined
    const activeQuestId = active?.id
    const activeStep = active?.currentStep

    const filteredBindings = list.filter((b) => {
      if (!b || typeof b.pointKey !== 'string') return false
      if (!activeQuestId || !activeStep) return Boolean(b.isStart)
      if (b.questId !== activeQuestId) return false
      return typeof b.stepKey === 'string' && b.stepKey === activeStep
    })

    const result = filteredBindings
      .map((b) => {
        const p = pointsArr.find((x) => x?.key === b.pointKey)
        if (!p) return null
        const dialogKey = (typeof b.dialogKey === 'string' ? b.dialogKey : undefined) ?? p.dialogKey
        const merged: Point = typeof dialogKey === 'string' ? { ...p, dialogKey } : p
        return merged
      })
      .filter((x): x is Point => x !== null)

    try {
      logger.info('MAP', 'visible:loaded', { count: result.length, keys: result.map((p) => p.key) })
    } catch {}
    setPoints(result as VisibleMapPoint[])
    lastLoadedAtRef.current = 0
  }, [mappointBindings, mapPointsData, activeQuests])

  return points
}


