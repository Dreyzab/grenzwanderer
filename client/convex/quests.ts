import { mutation } from './_generated/server'
import { v } from 'convex/values'

async function getIdentitySubject(ctx: any): Promise<string | null> {
  try {
    const id = await ctx.auth.getUserIdentity()
    return id?.subject ?? null
  } catch {
    return null
  }
}

async function getOrEnsurePlayerState(ctx: any, deviceId: string) {
  const now = Date.now()
  const subject = await getIdentitySubject(ctx)
  if (subject) {
    const rows = await (ctx.db as any).query('player_state').withIndex('by_user', (q: any) => q.eq('userId', subject)).collect()
    if (rows.length > 0) return rows.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0]
    const id = await (ctx.db as any).insert('player_state', {
      userId: subject,
      deviceId,
      phase: 0,
      status: 'refugee',
      inventory: [],
      hasPda: false,
      fame: 0,
      reputations: {},
      relationships: {},
      flags: [],
      updatedAt: now,
    })
    return await (ctx.db as any).get(id)
  }
  const rows = await (ctx.db as any).query('player_state').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).collect()
  if (rows.length > 0) return rows.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0]
  const id = await (ctx.db as any).insert('player_state', {
    userId: undefined,
    deviceId,
    phase: 0,
    status: 'refugee',
    inventory: [],
    hasPda: false,
    fame: 0,
    reputations: {},
    relationships: {},
    flags: [],
    updatedAt: now,
  })
  return await (ctx.db as any).get(id)
}

export const initializeSession = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const subject = await getIdentitySubject(ctx)
    const playerState = await getOrEnsurePlayerState(ctx, deviceId)
    const phase = playerState?.phase ?? 0

    // Merge progress: user has priority over device
    const progress: any[] = []
    if (subject) {
      const rows = await (ctx.db as any).query('quest_progress').withIndex('by_user', (q: any) => q.eq('userId', subject)).collect()
      progress.push(...rows)
    }
    const devRows = await (ctx.db as any).query('quest_progress').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).collect()
    const seen = new Set(progress.map((r) => r.questId))
    for (const r of devRows) if (!seen.has(r.questId)) progress.push(r)

    // Catalogs filtered by phase
    const allRegistry = await (ctx.db as any).query('quest_registry').collect()
    const questRegistry = allRegistry.filter((m: any) => (typeof m.phaseGate === 'number' ? phase >= m.phaseGate : true))
    const allBindings = await (ctx.db as any).query('mappoint_bindings').collect()
    const mappointBindings = allBindings.filter((b: any) => {
      const fromOk = typeof b.phaseFrom === 'number' ? phase >= b.phaseFrom : true
      const toOk = typeof b.phaseTo === 'number' ? phase <= b.phaseTo : true
      return fromOk && toOk
    })
    const pointKeys = Array.from(new Set(mappointBindings.map((b: any) => b.pointKey)))
    const mapPoints: any[] = []
    for (const key of pointKeys) {
      const p = await (ctx.db as any).query('map_points').withIndex('by_key', (q: any) => q.eq('key', key)).unique()
      if (p) mapPoints.push(p)
    }

    const world = await (ctx.db as any).query('world_state').withIndex('by_key', (q: any) => q.eq('key', 'global')).unique()

    return {
      ok: true as const,
      playerState,
      progress,
      questRegistry,
      mappointBindings,
      mapPoints,
      worldState: world ?? { key: 'global', phase: 0, flags: [], updatedAt: 0 },
      userId: subject ?? null,
    }
  },
})

export const syncProgress = mutation({
  args: {
    deviceId: v.string(),
    progress: v.object({
      activeQuests: v.record(v.string(), v.object({ currentStep: v.string(), startedAt: v.optional(v.number()) })),
      completedQuests: v.array(v.string()),
    }),
  },
  handler: async (ctx, { deviceId, progress }) => {
    const now = Date.now()
    const subject = await getIdentitySubject(ctx)

    if (subject) {
      const byUser = await (ctx.db as any).query('quest_progress').withIndex('by_user', (q: any) => q.eq('userId', subject)).collect()
      for (const r of byUser) await (ctx.db as any).delete(r._id)
    }
    const byDevice = await (ctx.db as any).query('quest_progress').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).collect()
    for (const r of byDevice) await (ctx.db as any).delete(r._id)

    const completedSet = new Set(progress.completedQuests)
    for (const [questId, entry] of Object.entries(progress.activeQuests ?? {})) {
      if (completedSet.has(questId)) continue
      await (ctx.db as any).insert('quest_progress', {
        userId: subject ?? undefined,
        deviceId,
        questId,
        currentStep: (entry as any).currentStep,
        startedAt: (entry as any).startedAt ?? now,
        updatedAt: now,
        completedAt: undefined,
      })
    }
    for (const questId of progress.completedQuests ?? []) {
      await (ctx.db as any).insert('quest_progress', {
        userId: subject ?? undefined,
        deviceId,
        questId,
        currentStep: 'completed',
        startedAt: now,
        updatedAt: now,
        completedAt: now,
      })
    }
    return { ok: true }
  },
})


// Dev: сид реестра квестов (фаза 1)
export const seedQuestRegistryDev = mutation({
  args: { devToken: v.string() },
  handler: async ({ db }, { devToken }) => {
    const expected = (globalThis as any)?.process?.env?.VITE_DEV_SEED_TOKEN ?? (globalThis as any)?.VITE_DEV_SEED_TOKEN
    if (expected && devToken !== expected) throw new Error('Forbidden: invalid dev token')
    const now = Date.now()
    const rows: Array<{ questId: string; type: 'story' | 'faction' | 'personal' | 'procedural'; priority: number; phaseGate: number }> = [
      { questId: 'field_medicine', type: 'story', priority: 10, phaseGate: 1 },
      { questId: 'combat_baptism', type: 'story', priority: 9, phaseGate: 1 },
      { questId: 'quiet_cove_whisper', type: 'story', priority: 8, phaseGate: 1 },
      { questId: 'bell_for_lost', type: 'story', priority: 7, phaseGate: 1 },
    ]
    let upserts = 0
    for (const r of rows) {
      const existing = await (db as any).query('quest_registry').withIndex('by_quest', (q: any) => q.eq('questId', r.questId)).unique()
      if (existing) {
        await (db as any).patch(existing._id, { ...existing, ...r, updatedAt: now })
      } else {
        await (db as any).insert('quest_registry', { ...r, updatedAt: now })
      }
      upserts++
    }
    return { ok: true, count: upserts }
  },
})


