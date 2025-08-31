import { mutation } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'
import { requirementsSatisfied } from './helpers/mappoints'

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
      credits: 0,
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
    credits: 0,
    fame: 0,
    reputations: {},
    relationships: {},
    flags: [],
    updatedAt: now,
  })
  return await (ctx.db as any).get(id)
}

async function applyOutcomeImpl(ctx: any, args: {
  deviceId: string
  fameDelta?: number
  reputationsDelta?: Record<string, number>
  relationshipsDelta?: Record<string, number>
  addFlags?: string[]
  removeFlags?: string[]
  addWorldFlags?: string[]
  removeWorldFlags?: string[]
  setPhase?: number
  setStatus?: string
}) {
  const now = Date.now()
  const subject = await getIdentitySubject(ctx)
  const state = await getOrEnsurePlayerState(ctx, args.deviceId)
  if (state?._id) {
    const next: any = { updatedAt: now }
    if (typeof args.setPhase === 'number') next.phase = Math.max(0, Math.floor(args.setPhase))
    if (typeof args.setStatus === 'string') next.status = args.setStatus
    if (typeof args.fameDelta === 'number') next.fame = Math.max(0, (state.fame ?? 0) + args.fameDelta)
    if (args.reputationsDelta) {
      const rep = { ...(state.reputations ?? {}) }
      for (const [k, d] of Object.entries(args.reputationsDelta)) rep[k] = Math.max(0, (rep[k] ?? 0) + (d as number))
      next.reputations = rep
    }
    if (args.relationshipsDelta) {
      const rel = { ...(state.relationships ?? {}) }
      for (const [k, d] of Object.entries(args.relationshipsDelta)) rel[k] = Math.max(0, (rel[k] ?? 0) + (d as number))
      next.relationships = rel
    }
    if (args.addFlags || args.removeFlags) {
      const flags = new Set<string>(state.flags ?? [])
      for (const f of args.addFlags ?? []) flags.add(f)
      for (const f of args.removeFlags ?? []) flags.delete(f)
      next.flags = Array.from(flags)
    }
    await (ctx.db as any).patch(state._id, next)
  }
  // World state flags
  try {
    const world = await (ctx.db as any).query('world_state').withIndex('by_key', (q: any) => q.eq('key', 'global')).unique()
    const flags = new Set<string>(world?.flags ?? [])
    for (const f of args.addWorldFlags ?? []) flags.add(f)
    for (const f of args.removeWorldFlags ?? []) flags.delete(f)
    const next = { key: 'global', phase: world?.phase ?? 0, flags: Array.from(flags), updatedAt: now }
    if (world) await (ctx.db as any).patch(world._id, next)
    else await (ctx.db as any).insert('world_state', next)
  } catch {}
}

export const initializeSession = mutation({
  args: { deviceId: v.string(), clientPhase: v.optional(v.number()) },
  handler: async (ctx, { deviceId, clientPhase }) => {
    const subject = await getIdentitySubject(ctx)
    const playerState = await getOrEnsurePlayerState(ctx, deviceId)
    const safeClientPhase = Number.isFinite(clientPhase as number) && (clientPhase as number) >= 0 ? Math.floor(clientPhase as number) : 0
    const phase = Math.max(playerState?.phase ?? 0, safeClientPhase)

    // Merge progress: user has priority over device
    const progress: any[] = []
    if (subject) {
      const rows = await (ctx.db as any).query('quest_progress').withIndex('by_user', (q: any) => q.eq('userId', subject)).collect()
      progress.push(...rows)
    }
    const devRows = await (ctx.db as any).query('quest_progress').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).collect()
    const seen = new Set(progress.map((r) => r.questId))
    for (const r of devRows) if (!seen.has(r.questId)) progress.push(r)

    // Catalogs filtered by phase and requirements
    const allRegistry = await (ctx.db as any).query('quest_registry').collect()

    // Функция проверки требований для квеста
    const meetsRequirements = (questMeta: any, playerState: any) => {
      if (!questMeta.requirements) return true

      const reqs = questMeta.requirements
      const playerFame = playerState?.fame ?? 0

      // Проверка минимальной известности
      if (typeof reqs.fameMin === 'number' && playerFame < reqs.fameMin) {
        return false
      }

      // Проверка минимальной фазы
      if (typeof reqs.phaseMin === 'number' && phase < reqs.phaseMin) {
        return false
      }

      // Проверка максимальной фазы
      if (typeof reqs.phaseMax === 'number' && phase > reqs.phaseMax) {
        return false
      }

      // Проверка обязательных флагов
      if (reqs.requiredFlags && reqs.requiredFlags.length > 0) {
        const playerFlags = new Set(playerState?.flags ?? [])
        if (!reqs.requiredFlags.every((flag: string) => playerFlags.has(flag))) {
          return false
        }
      }

      // Проверка запрещенных флагов
      if (reqs.forbiddenFlags && reqs.forbiddenFlags.length > 0) {
        const playerFlags = new Set(playerState?.flags ?? [])
        if (reqs.forbiddenFlags.some((flag: string) => playerFlags.has(flag))) {
          return false
        }
      }

      return true
    }

    const questRegistry = allRegistry.filter((m: any) => {
      // Фильтр по phaseGate
      const phaseOk = typeof m.phaseGate === 'number' ? phase >= m.phaseGate : true

      // Фильтр по требованиям
      const requirementsOk = meetsRequirements(m, playerState)

      return phaseOk && requirementsOk
    })
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
      playerState: { ...playerState, phase },
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
      // Наградим игрока за завершение ключевых квестов (минимальная логика)
      try {
        const state = await getOrEnsurePlayerState(ctx, deviceId)
        if (state?._id) {
          let addFame = 0
          let addCredits = 0

          // Награды за завершение квестов
          if (questId === 'combat_baptism') {
            addFame = 25
            addCredits = 25
          } else if (questId === 'field_medicine') {
            addFame = 15
            addCredits = 40
          } else if (questId === 'quiet_cove_whisper') {
            addFame = 20
            addCredits = 50
          }

          const nextFame = Math.max(0, (state.fame ?? 0) + addFame)
          const nextCredits = Math.max(0, (state.credits ?? 0) + addCredits)
          await (ctx.db as any).patch(state._id, { fame: nextFame, credits: nextCredits, updatedAt: now })
        }
      } catch {}
    }
    return { ok: true }
  },
})


// Explicitly set player phase (server authoritative write)
export const setPlayerPhase = mutation({
  args: { deviceId: v.string(), phase: v.number() },
  handler: async (ctx, { deviceId, phase }) => {
    const now = Date.now()
    const safe = Number.isFinite(phase) && phase >= 0 ? Math.floor(phase) : 0
    const state = await getOrEnsurePlayerState(ctx, deviceId)
    if (state?._id && (state.phase ?? 0) < safe) {
      await (ctx.db as any).patch(state._id, { phase: safe, updatedAt: now })
    }
    return { ok: true, phase: safe }
  },
})

export const setPlayerHealth = mutation({
  args: { deviceId: v.string(), health: v.number() },
  handler: async (ctx, { deviceId, health }) => {
    const now = Date.now()
    const safe = Number.isFinite(health) ? Math.max(0, Math.min(1, health)) : 1
    const state = await getOrEnsurePlayerState(ctx, deviceId)
    if (state?._id) {
      await (ctx.db as any).patch(state._id, { health: safe, updatedAt: now })
    }
    return { ok: true, health: safe }
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

// Dev: сид реестра квестов (фаза 2) с условиями
export const seedQuestRegistryPhase2Dev = mutation({
  args: { devToken: v.string() },
  handler: async ({ db }, { devToken }) => {
    const expected = (globalThis as any)?.process?.env?.VITE_DEV_SEED_TOKEN ?? (globalThis as any)?.VITE_DEV_SEED_TOKEN
    if (expected && devToken !== expected) throw new Error('Forbidden: invalid dev token')
    const now = Date.now()

    // Квесты фазы 2 с условиями
    const phase2Rows: Array<{
      questId: string;
      type: 'story' | 'faction' | 'personal' | 'procedural';
      priority: number;
      phaseGate: number;
      requirements?: {
        fameMin?: number;
        phaseMin?: number;
        phaseMax?: number;
        requiredFlags?: string[];
        forbiddenFlags?: string[];
      }
    }> = [
      {
        questId: 'citizenship_invitation',
        type: 'story',
        priority: 15, // Высокий приоритет
        phaseGate: 2,
        requirements: {
          fameMin: 70, // Условие: известность >= 70
          phaseMin: 2   // Должен быть в фазе 2
        }
      },
      {
        questId: 'eyes_in_the_dark',
        type: 'story',
        priority: 12,
        phaseGate: 2,
        requirements: {
          phaseMin: 2
        }
      },
      {
        questId: 'void_shards',
        type: 'story',
        priority: 10,
        phaseGate: 2,
        requirements: {
          phaseMin: 2
        }
      }
    ]

    let upserts = 0
    for (const r of phase2Rows) {
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


export const commitScene = mutation({
  args: {
    deviceId: v.string(),
    playerVersion: v.optional(v.number()),
    progressVersion: v.optional(v.number()),
    opSeq: v.optional(v.number()),
    questOps: v.array(
      v.object({
        op: v.union(v.literal('start'), v.literal('advance'), v.literal('complete')),
        questId: v.string(),
        step: v.optional(v.string()),
      }),
    ),
    rewardHint: v.optional(v.string()),
    outcome: v.object({
      // Whitelist only safe fields — server ignores anything else
      reputationsDelta: v.optional(v.record(v.string(), v.number())),
      relationshipsDelta: v.optional(v.record(v.string(), v.number())),
      addFlags: v.optional(v.array(v.string())),
      removeFlags: v.optional(v.array(v.string())),
      addWorldFlags: v.optional(v.array(v.string())),
      removeWorldFlags: v.optional(v.array(v.string())),
      setPhase: v.optional(v.number()),
      setStatus: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { deviceId, questOps, outcome, rewardHint }) => {
    const subject = await getIdentitySubject(ctx)
    const nowMaster = Date.now()
    for (const op of questOps) {
      const now = Date.now()
      const { questId, op: action, step } = op as any
      let existing = subject
        ? await (ctx.db as any)
            .query('quest_progress')
            .withIndex('by_user_quest', (q: any) => q.eq('userId', subject).eq('questId', questId))
            .unique()
        : await (ctx.db as any)
            .query('quest_progress')
            .withIndex('by_device_quest', (q: any) => q.eq('deviceId', deviceId).eq('questId', questId))
            .unique()
      if (!existing && subject) {
        const devOnly = await (ctx.db as any)
          .query('quest_progress')
          .withIndex('by_device_quest', (q: any) => q.eq('deviceId', deviceId).eq('questId', questId))
          .unique()
        if (devOnly) {
          await (ctx.db as any).patch(devOnly._id, { userId: subject, updatedAt: now })
          existing = devOnly
        }
      }
      // Fetch registry meta for validation
      const meta = await (ctx.db as any)
        .query('quest_registry')
        .withIndex('by_quest', (q: any) => q.eq('questId', questId))
        .unique()
      if (action === 'start') {
        // Strict: allow only if not started or completed but repeatable
        if (existing) {
          const alreadyCompleted = Boolean(existing.completedAt)
          const repeatable = Boolean(meta?.repeatable)
          if (alreadyCompleted && !repeatable) throw new Error('Quest already completed and not repeatable')
          if (!existing.currentStep || existing.currentStep === 'not_started') {
            await (ctx.db as any).patch(existing._id, { currentStep: step, updatedAt: now, completedAt: undefined })
          } else if (repeatable && alreadyCompleted) {
            await (ctx.db as any).patch(existing._id, { currentStep: step ?? 'start', updatedAt: now, completedAt: undefined, startedAt: now })
          } else {
            throw new Error('Quest already started')
          }
        } else {
          await (ctx.db as any).insert('quest_progress', {
            userId: subject ?? undefined,
            deviceId,
            questId,
            currentStep: step ?? 'start',
            startedAt: now,
            updatedAt: now,
            completedAt: undefined,
          })
        }
      } else if (action === 'advance') {
        if (!existing) throw new Error('Quest not started')
        if (existing.completedAt) throw new Error('Quest already completed')
        await (ctx.db as any).patch(existing._id, { currentStep: step, updatedAt: now })
      } else if (action === 'complete') {
        if (!existing) throw new Error('Quest not started')
        if (existing.completedAt) throw new Error('Quest already completed')
        await (ctx.db as any).patch(existing._id, { currentStep: 'completed', completedAt: now, updatedAt: now })
      }
    }
    // Safe server-calculated rewards by hint
    if (typeof rewardHint === 'string') {
      try {
        const state = await getOrEnsurePlayerState(ctx, deviceId)
        if (state?._id) {
          let fame = 0
          let credits = 0
          if (rewardHint === 'combat_tutorial') { fame = 0; credits = 0 }
          if (rewardHint === 'combat_baptism_complete') { fame = 25; credits = 25 }
          if (rewardHint === 'field_medicine_complete') { fame = 15; credits = 40 }
          if (rewardHint === 'quiet_cove_complete') { fame = 20; credits = 50 }
          if (fame !== 0 || credits !== 0) {
            await (ctx.db as any).patch(state._id, {
              fame: Math.max(0, (state.fame ?? 0) + fame),
              credits: Math.max(0, (state.credits ?? 0) + credits),
              updatedAt: Date.now(),
            })
          }
        }
      } catch {}
    }
    // Apply only whitelisted outcome fields
    await applyOutcomeImpl(ctx, { deviceId, ...outcome })

    const sources = new Set<string>()
    for (const op of questOps) {
      const meta = await (ctx.db as any)
        .query('quest_registry')
        .withIndex('by_quest', (q: any) => q.eq('questId', (op as any).questId))
        .unique()
      if (meta?.giverNpcId) sources.add(`npc:${meta.giverNpcId}`)
      if (meta?.boardKey) sources.add(`board:${meta.boardKey}`)
    }

    // Lightweight available quests per source
    const availableQuests: Record<string, any[]> = {}
    try {
      const state = await getOrEnsurePlayerState(ctx, deviceId)
      const phase = state?.phase ?? 0
      for (const token of sources) {
        const [type, key] = token.split(':')
        const index = type === 'npc' ? 'by_giver' : 'by_board'
        const rows = await (ctx.db as any)
          .query('quest_registry')
          .withIndex(index, (q: any) => q.eq(type === 'npc' ? 'giverNpcId' : 'boardKey', key))
          .collect()
        const list = (rows as any[])
          .filter((m) => (typeof m.phaseGate === 'number' ? phase >= m.phaseGate : true))
          .filter((m) => requirementsSatisfied((m as any).requirements, state))
          .map((m) => ({ id: m.questId, type: m.type, priority: m.priority }))
          .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
        availableQuests[token] = list
      }
    } catch {
      // ignore, keep availableQuests empty
    }

    // Merge progress view
    const progress: any[] = []
    if (subject) {
      const u = await (ctx.db as any).query('quest_progress').withIndex('by_user', (q: any) => q.eq('userId', subject)).collect()
      progress.push(...u)
    }
    const devRows = await (ctx.db as any).query('quest_progress').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).collect()
    const seen = new Set((progress as any[]).map((r) => r.questId))
    for (const r of devRows) if (!seen.has((r as any).questId)) progress.push(r)

    // Visible points from server if available
    let visiblePoints: any[] = []
    let visibleVersion = nowMaster
    try {
      const subject2 = subject
      const mapPointsApi: any = (api as any)?.mapPoints
      if (mapPointsApi?.listVisible) {
        const vp = (await (ctx as any).runQuery(mapPointsApi.listVisible, { deviceId, userId: subject2 ?? undefined })) as any
        if (Array.isArray(vp)) visiblePoints = vp
      }
    } catch {
      visiblePoints = []
    }

    const subject3 = subject
    const playerState = await getOrEnsurePlayerState(ctx, deviceId)
    return {
      playerState,
      progress,
      availableQuests,
      visiblePoints,
      version: { player: playerState?.updatedAt ?? nowMaster, progress: nowMaster, visiblePoints: visibleVersion },
      ttlMs: 60000,
      userId: subject3 ?? undefined,
    }
  },
})
