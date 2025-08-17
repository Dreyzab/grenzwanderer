import { useEffect, useState } from 'react'
import type { VisibleMapPoint } from '@/entities/map-point/model/types'
import { mapPointsApi } from '@/shared/api/mapPoints'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import { useAuthStore } from '@/entities/auth/model/store'
import { seedDemoMapPoints } from '@/entities/map-point/api/seed'
import { mapPointApi } from '@/entities/map-point/api/local'
import { filterVisiblePoints } from '@/features/quest-progress/model/visibility'
import logger from '@/shared/lib/logger'
import { useQuest } from '@/entities/quest/model/useQuest'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'

export function useVisiblePoints() {
  const [points, setPoints] = useState<VisibleMapPoint[]>([])
  const { userId } = useAuthStore()
  const quest = useQuest()
  const phase = useProgressionStore((s) => s.phase)

  useEffect(() => {
    ;(async () => {
      let stored: VisibleMapPoint[] = []
      try {
        const serverPoints = (await mapPointsApi.listVisible({
          deviceId: userId ? undefined : getOrCreateDeviceId(),
          userId: userId ?? undefined,
        })) as any[]
        if (Array.isArray(serverPoints) && serverPoints.length > 0) {
          stored = serverPoints.map((sp) => ({
            id: sp.key,
            title: sp.title,
            description: sp.description ?? '',
            coordinates: sp.coordinates,
            type: sp.type ?? 'poi',
            isActive: sp.active,
            dialogKey: sp.dialogKey ?? '',
            questId: sp.questId ?? '',
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

      let visible = stored
      if (import.meta.env.DEV) {
        const deliveryStep = quest.getStep('delivery_and_dilemma')
        const loyaltyStep = quest.activeQuests['loyalty_fjr']?.currentStep ?? null
        const waterStep = quest.activeQuests['water_crisis']?.currentStep ?? null
        const freedomStep = quest.activeQuests['freedom_spark']?.currentStep ?? null
        visible = filterVisiblePoints(stored, { deliveryStep, loyaltyStep, waterStep, freedomStep })
      }

      logger.info('MAP', 'Points total:', stored.length, 'visible:', visible.length)
      setPoints(visible)
    })()
  }, [quest.activeQuests, phase, userId])

  return points
}


