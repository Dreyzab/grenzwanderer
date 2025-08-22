import { useEffect, useMemo, useState } from 'react'
import type { MapPointType } from '@/shared/constants'
import { useGameDataStore } from '@/app/ConvexProvider'
import { useQuestStore } from '@/entities/quest/model/questStore'
import { usePlayerStore } from '@/entities/player/model/store'
import logger from '@/shared/lib/logger'
import { questCatalog } from '@/entities/quest/model/catalog'

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

export function useClientVisiblePoints() {
  const [points, setPoints] = useState<VisibleMapPoint[]>([])
  const bindings = useGameDataStore((s) => s.mappointBindings)
  const mapPoints = useGameDataStore((s) => s.mapPoints)
  const activeQuests = useQuestStore((s) => s.activeQuests)
  const completedQuests = useQuestStore((s) => s.completedQuests)
  const phase = usePlayerStore((s) => s.phase ?? 0)

  const visible = useMemo(() => {
    try { logger.debug('MAP', 'visible:inputs', { bindings: (bindings ?? []).length, mapPoints: (mapPoints ?? []).length, phase: phase ?? 0, activeQuests: Object.keys(activeQuests ?? {}).length }) } catch {}
    // Фильтр по фазе
    const byPhase = (bindings ?? []).filter((b: any) => {
      const fromOk = typeof b.phaseFrom === 'number' ? phase >= b.phaseFrom : true
      const toOk = typeof b.phaseTo === 'number' ? phase <= b.phaseTo : true
      return fromOk && toOk
    })
    try { logger.debug('MAP', 'visible:after_phase', { count: byPhase.length }) } catch {}

    // Активный квест/шаг (первый активный достаточно для MVP)
    const firstActive = Object.values(activeQuests ?? {})[0] as any | undefined
    const activeQuestId = firstActive?.id as string | undefined
    const activeStep = firstActive?.currentStep as string | undefined
    try { logger.debug('MAP', 'visible:active', { activeQuestId, activeStep }) } catch {}

    // Если нет активного квеста — показываем только стартовые биндинги (включая фазу 0)
    // Если квест активен — показываем биндинги текущего шага И/ИЛИ стартовый биндинг, если activeStep === startKey.
    const filtered = !activeQuestId || !activeStep
      ? byPhase.filter((b: any) => Boolean(b.isStart) || typeof b.startKey === 'string')
      : byPhase.filter((b: any) => {
          if (b.questId !== activeQuestId) return false
          const isStep = typeof b.stepKey === 'string' && b.stepKey === activeStep
          const isStartForStep = Boolean(b.isStart) && typeof b.startKey === 'string' && b.startKey === activeStep
          return isStep || isStartForStep
        })
    try { logger.debug('MAP', 'visible:after_step_filter', { count: filtered.length }) } catch {}

    let result = filtered
      .map((b: any) => {
        const p = (mapPoints as any)?.find((x: any) => x.key === b.pointKey)
        if (!p) return null
        const dialogKey = (b as any).dialogKey ?? (p as any).dialogKey
        return { ...p, dialogKey }
      })
      .filter(Boolean) as VisibleMapPoint[]

    // Дополнительный фолбэк: если стартовые биндинги не размечены isStart/startKey, показываем все точки из byPhase
    if ((result?.length ?? 0) === 0 && (!activeQuestId || !activeStep)) {
      const byPhasePoints = byPhase
        .map((b: any) => (mapPoints as any)?.find((x: any) => x.key === b.pointKey))
        .filter(Boolean) as VisibleMapPoint[]
      if (byPhasePoints.length > 0) {
        try { logger.info('MAP', 'visible:fallback_byPhase', { count: byPhasePoints.length, keys: byPhasePoints.map((p) => p.key) }) } catch {}
        result = byPhasePoints
      }
    }

    // Фолбэк для фазы >=1: если нет биндингов на старте (не засеяны), строим точки из локального каталога
    if ((result?.length ?? 0) === 0 && (!activeQuestId || !activeStep) && (phase ?? 0) >= 1) {
      try {
        const completed = new Set((completedQuests ?? []) as any[])
        const phaseQuests = questCatalog.filter((q) => q.phase <= (phase ?? 0))
        const startPoints = phaseQuests
          .filter((q) => !completed.has(q.id as any))
          .map((q) => (mapPoints as any)?.find((x: any) => x.key === q.startPointKey))
          .filter(Boolean)
        result = (startPoints as any[]).map((p: any) => ({ ...p }))
        logger.info('MAP', 'visible:fallback_catalog', { count: result.length, keys: result.map((p: any) => p.key) })
      } catch {}
    }

    try { logger.info('MAP', 'visible:loaded', { count: result.length, keys: result.map((p) => p.key) }) } catch {}
    return result
  }, [bindings, mapPoints, activeQuests, completedQuests, phase])

  useEffect(() => setPoints(visible), [visible])
  return points
}


