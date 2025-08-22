import { useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import { useQuest } from './useQuest'
import { useProgressionStore } from './progressionStore'
import { useAuthStore } from '@/entities/auth/model/store'

export function useServerProgressHydration() {
  const deviceId = getOrCreateDeviceId()
  const { userId } = useAuthStore()
  const serverProgress = useQuery(api.quests.getProgress, { deviceId, userId: userId || undefined })
  const quest = useQuest()
  useEffect(() => {
    if (!serverProgress) return
    const mapped = serverProgress.map((p: any) => ({ id: p.questId, currentStep: p.currentStep, completedAt: p.completedAt ?? null }))
    quest.hydrate(mapped as any)
  }, [serverProgress])
}

export function useWorldPhaseSync() {
  const world = useQuery(api.quests.getWorldState, {})
  const { userId } = useAuthStore()
  const progression = useProgressionStore()
  useEffect(() => {
    if (!world || typeof world.phase !== 'number') return
    if (userId && world.phase > progression.phase) {
      progression.setPhase(world.phase as any)
    }
  }, [world?.phase, userId])
}


