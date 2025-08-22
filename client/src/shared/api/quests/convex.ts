// Convex: используем только для initialize/syncProgress, остальное — no-op
import { convexClient } from '@/shared/lib/convexClient'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import { useGameDataStore } from '@/app/ConvexProvider'
import { usePlayerStore } from '@/entities/player/model/store'
import { api } from '../../../../convex/_generated/api'

type SourceType = 'npc' | 'board'

export const questsApiConvex = {
  bootstrapNewPlayer: async () => {
    getOrCreateDeviceId()
    return { ok: true }
  },

  setPlayerPhase: async (phase: number) => {
    const deviceId = getOrCreateDeviceId()
    // Try to update on server; fallback to client-only persist if unavailable
    try {
      const res = await convexClient.mutation((api as any).quests.setPlayerPhase, { deviceId, phase })
      try { localStorage.setItem('player-phase', String(res?.phase ?? phase)) } catch {}
      return { ok: true, phase: res?.phase ?? phase }
    } catch (e) {
      console.warn('[PHASE] setPlayerPhase server call failed; fallback to client-only', e)
      try { localStorage.setItem('player-phase', String(phase)) } catch {}
      return { ok: true, phase }
    }
  },

  getPlayerState: async () => {
    const deviceId = getOrCreateDeviceId()
    const phaseStr = (() => { try { return localStorage.getItem('player-phase') } catch { return null } })()
    const phase = phaseStr ? Number(phaseStr) : 0
    return { phase, status: 'refugee', inventory: [], updatedAt: Date.now(), deviceId } as any
  },

  getAvailableQuests: async (_sourceType: SourceType, _sourceKey: string) => {
    // Источник: локальный каталог, загруженный снапшотом из initializeSession
    const { questRegistry } = useGameDataStore.getState()
    const storePhase = usePlayerStore.getState().phase
    const localPhaseStr = (() => { try { return localStorage.getItem('player-phase') } catch { return null } })()
    const phase = typeof storePhase === 'number' ? storePhase : localPhaseStr ? Number(localPhaseStr) : 0

    const items = (questRegistry ?? [])
      .filter((q: any) => (typeof q.phaseGate === 'number' ? phase >= q.phaseGate : true))
      .map((q: any) => ({ id: q.id ?? q.questId ?? q.key, type: q.type ?? 'story', priority: q.priority ?? 0 }))
      .filter((q: any) => Boolean(q.id))
      .sort((a: any, b: any) => (b.priority ?? 0) - (a.priority ?? 0))

    return items as any
  },

  // Новая фоновая синхронизация: отдаём снапшот прогресса
  syncProgress: async (progress: { activeQuests: Record<string, { currentStep: string; startedAt?: number }>; completedQuests: string[] }) => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.mutation((api as any).quests.syncProgress, { deviceId, progress } as any)
  },

  applyDialogOutcome: async (outcomeKey: string) => {
    // No-op in client-authoritative mode
    console.warn('[DIALOG] applyDialogOutcome skipped (client-only):', outcomeKey)
    return { ok: false, error: 'client-only mode: applyDialogOutcome skipped', outcomeKey }
  },

  migrateDeviceToUser: async (userId: string) => {
    getOrCreateDeviceId()
    return { ok: true, userId }
  },

  finalizeRegistration: async (_nickname: string, _avatarKey?: string) => {
    getOrCreateDeviceId()
    return { ok: true }
  },
}


