// Convex: используем только для initialize/syncProgress, остальное — no-op
import { convexClient } from '@/shared/lib/convexClient'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import { useGameDataStore } from '@/app/ConvexProvider'
import { usePlayerStore } from '@/entities/player/model/store'
import { api } from '../../../../convex/_generated/api'
import { enqueueCommit, nextOpSeq, takeAllCommits } from '@/shared/lib/outbox'

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
    const healthStr = (() => { try { return localStorage.getItem('player-health') } catch { return null } })()
    const health = healthStr ? Number(healthStr) : 1
    return { phase, health, status: 'refugee', inventory: [], updatedAt: Date.now(), deviceId } as any
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

  setPlayerHealth: async (health: number) => {
    const deviceId = getOrCreateDeviceId()
    try {
      const res = await convexClient.mutation((api as any).quests.setPlayerHealth, { deviceId, health })
      try { localStorage.setItem('player-health', String(res?.health ?? health)) } catch {}
      return { ok: true, health: res?.health ?? health }
    } catch (e) {
      console.warn('[HEALTH] setPlayerHealth server call failed; fallback to client-only', e)
      try { localStorage.setItem('player-health', String(health)) } catch {}
      return { ok: true, health }
    }
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

  // Atomic scene commit: questOps + outcome, returns fresh player/progress/map
  commitScene: async (payload: {
    questOps: Array<{ op: 'start' | 'advance' | 'complete'; questId: string; step?: string }>
    playerVersion?: number
    progressVersion?: number
    opSeq?: number
    rewardHint?: string
    outcome?: {
      fameDelta?: number
      reputationsDelta?: Record<string, number>
      relationshipsDelta?: Record<string, number>
      addFlags?: string[]
      removeFlags?: string[]
      addWorldFlags?: string[]
      removeWorldFlags?: string[]
      setPhase?: number
      setStatus?: string
    }
  }) => {
    const deviceId = getOrCreateDeviceId()
    const mod = (api as any)?.quests
    // Try to flush pending outbox first
    try {
      const pending = takeAllCommits()
      for (const p of pending) {
        if (!convexClient?.mutation || !mod?.commitScene) { enqueueCommit(p); break }
        await convexClient.mutation(mod.commitScene, { deviceId, ...p })
      }
    } catch {
      // keep pending; will retry later
    }
    // Call server if available, otherwise simulate client-side
    let res: any
    if (convexClient?.mutation && mod?.commitScene) {
      res = await convexClient.mutation(mod.commitScene, {
        deviceId,
        playerVersion: payload.playerVersion,
        progressVersion: payload.progressVersion,
        opSeq: payload.opSeq ?? nextOpSeq(),
        questOps: payload.questOps ?? [],
        rewardHint: payload.rewardHint,
        outcome: {
          reputationsDelta: payload.outcome?.reputationsDelta,
          relationshipsDelta: payload.outcome?.relationshipsDelta,
          addFlags: payload.outcome?.addFlags,
          removeFlags: payload.outcome?.removeFlags,
          addWorldFlags: payload.outcome?.addWorldFlags,
          removeWorldFlags: payload.outcome?.removeWorldFlags,
          setPhase: payload.outcome?.setPhase,
          setStatus: payload.outcome?.setStatus,
        },
      })
    } else {
      // Fallback: update local stores only
      res = { playerState: null, progress: [], availableQuests: {}, visiblePoints: [], version: { player: Date.now(), progress: Date.now(), visiblePoints: Date.now() }, ttlMs: 60000 }
      // Enqueue for later replay
      enqueueCommit({ ...payload, opSeq: payload.opSeq ?? nextOpSeq() })
    }

    // Apply progress to quest store in bulk
    try {
      const { useQuestStore } = await import('@/entities/quest/model/questStore')
      const applyBatch = useQuestStore.getState().applyBatch
      const fromServer = Array.isArray(res?.progress) ? (res.progress as any[]) : []
      const ops = fromServer.map((p) => ({ id: p.questId as string, step: p.currentStep as string, completedAt: p.completedAt ?? null }))
      if (ops.length > 0) applyBatch(ops as any)
    } catch {}

    // Hydrate player state (phase, reputations, etc)
    try {
      const { usePlayerStore } = await import('@/entities/player/model/store')
      if (res?.playerState) usePlayerStore.getState().hydrateFromServer(res.playerState as any)
      const { useProgressionStore } = await import('@/entities/quest/model/progressionStore')
      if (res?.playerState?.phase != null) useProgressionStore.getState().setPhase(((res.playerState.phase as number) ?? 0) as any)
    } catch {}

    // Cache server-visible points for the Map to prioritize
    try {
      const { useGameDataStore } = await import('@/app/ConvexProvider')
      if (Array.isArray(res?.visiblePoints)) useGameDataStore.getState().setServerVisiblePoints({ points: res.visiblePoints, version: (res as any)?.version?.visiblePoints, ttlMs: (res as any)?.ttlMs ?? 60000 })
    } catch {}

    // Optionally update available quests cache or visible points if needed in app state later
    return res as any
  },
}


