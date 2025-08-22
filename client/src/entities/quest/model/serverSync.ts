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
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[HYDRATE] Failed to hydrate quest progress from localStorage', error)
    }
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
      // Надёжная проверка изменений: сравнение содержимого
      const shallowEqualRecords = (a?: Record<string, any>, b?: Record<string, any>) => {
        if (a === b) return true
        if (!a || !b) return false
        const ak = Object.keys(a)
        const bk = Object.keys(b)
        if (ak.length !== bk.length) return false
        for (const k of ak) {
          const va = a[k]
          const vb = b[k]
          if (!vb) return false
          if (va?.currentStep !== vb?.currentStep || va?.startedAt !== vb?.startedAt) return false
        }
        return true
      }
      const arraysEqual = (x?: string[], y?: string[]) => {
        if (x === y) return true
        if (!x || !y) return false
        if (x.length !== y.length) return false
        for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false
        return true
      }
      if (shallowEqualRecords(curr.activeQuests, prevProgress.activeQuests) && arraysEqual(curr.completedQuests, prevProgress.completedQuests)) return
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
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('[SYNC] Failed to sync progress to server', error)
          }
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


