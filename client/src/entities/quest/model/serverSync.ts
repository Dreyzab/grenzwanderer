import { useEffect } from 'react'
// import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import { useQuest } from './useQuest'
import { useProgressionStore } from './progressionStore'
import { useAuthStore } from '@/entities/auth/model/store'
import { useQuestStore } from './questStore'
// Convex removed
import { convexClient } from '@/shared/lib/convexClient'
import { api } from '@/../convex/_generated/api'

export function useServerProgressHydration() {
  const quest = useQuest()
  useEffect(() => {
    try {
      const persisted = localStorage.getItem('quest-progress')
      if (!persisted) return
      const data = JSON.parse(persisted) as any
      const mapped = Object.entries((data?.state?.activeQuests ?? {}) as Record<string, any>).map(([id, q]: any) => ({ id, currentStep: q.currentStep, completedAt: null }))
      quest.hydrate(mapped as any)
    } catch {}
  }, [])
}

export function useWorldPhaseSync() {
  const { userId } = useAuthStore()
  const progression = useProgressionStore()
  useEffect(() => {
    const persisted = localStorage.getItem('world-state')
    const world = persisted ? (JSON.parse(persisted) as any) : { phase: 0 }
    if (userId && typeof world?.phase === 'number' && world.phase > progression.phase) {
      progression.setPhase(world.phase as any)
    }
  }, [userId])
}

// Фоновая синхронизация прогресса с дебаунсом
export function useBackgroundQuestSync() {
  useEffect(() => {
    let timeout: any = null
    const unsubscribe = useQuestStore.subscribe((state, prev) => {
      const curr = {
        activeQuests: state.activeQuests as Record<string, { currentStep: string; startedAt?: number }>,
        completedQuests: state.completedQuests as string[],
      }
      const prevProgress = {
        activeQuests: (prev as any)?.activeQuests as Record<string, { currentStep: string; startedAt?: number }>,
        completedQuests: (prev as any)?.completedQuests as string[],
      }
      // Простейшая проверка изменений по ссылке/длине
      const sameRefs = curr.activeQuests === prevProgress.activeQuests && curr.completedQuests === prevProgress.completedQuests
      if (sameRefs) return
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(async () => {
        try {
          const payload = {
            activeQuests: Object.fromEntries(
              Object.entries(curr.activeQuests ?? {}).map(([qid, q]: any) => [qid, { currentStep: q.currentStep, startedAt: q.startedAt }]),
            ) as Record<string, { currentStep: string; startedAt?: number }>,
            completedQuests: curr.completedQuests ?? [],
          }
          // store snapshot for persistence
          try {
            const raw = localStorage.getItem('quest-progress')
            const prev = raw ? JSON.parse(raw) : { state: {} }
            prev.state.activeQuests = payload.activeQuests
            prev.state.completedQuests = payload.completedQuests
            localStorage.setItem('quest-progress', JSON.stringify(prev))
          } catch {}
          // send snapshot to server (background)
          try {
            const deviceId = (await import('@/shared/lib/deviceId')).getOrCreateDeviceId()
            await convexClient.mutation((api as any).quests.syncProgress, { deviceId, progress: payload as any })
          } catch {}
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('[SYNC] Background sync failed', err)
        }
      }, 2500)
    })
    return () => {
      if (timeout) clearTimeout(timeout)
      unsubscribe?.()
    }
  }, [])
}


