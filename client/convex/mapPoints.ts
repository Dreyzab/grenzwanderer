import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { ensurePlayerState } from './helpers/player'
import { requirementsSatisfied } from './helpers/quest'
import { computeAllowedQuestMetaIds, selectStartBindings, diagnoseStartBindings } from './helpers/mappoints'
import { choosePointBinding } from './helpers/qr'
import { WORLD_KEYS, QR_RESOLVE_STATUS } from './constants'

// Helpers
async function getIdentitySubject(ctx: any): Promise<string | null> {
  try {
    const id = await ctx.auth.getUserIdentity()
    return id?.subject ?? null
  } catch {
    return null
  }
}

async function getPlayerStateSafe(ctx: any, deviceId?: string): Promise<any> {
  const p = await ensurePlayerState(ctx, { deviceId, createIfMissing: false })
  return p ?? { phase: 0, fame: 0, flags: [], reputations: {}, relationships: {} }
}

async function getQuestSets(ctx: any, subject: string | null, deviceId?: string): Promise<{ active: Set<string>; completed: Set<string> }> {
  const active = new Set<string>()
  const completed = new Set<string>()
  if (subject) {
    const userRows = await ctx.db.query('quest_progress').withIndex('by_user', (q: any) => q.eq('userId', subject)).collect()
    for (const r of userRows) {
      if (typeof r.completedAt === 'number') completed.add(r.questId)
      else active.add(r.questId)
    }
  }
  if (deviceId) {
    const devRows = await ctx.db.query('quest_progress').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).collect()
    for (const r of devRows) {
      if (typeof r.completedAt === 'number') completed.add(r.questId)
      else active.add(r.questId)
    }
  }
  return { active, completed }
}

// requirementsSatisfied вынесен в helpers/quest

async function dependenciesSatisfied(ctx: any, questId: string, completed: Set<string>): Promise<boolean> {
  const deps = await ctx.db.query('quest_dependencies').withIndex('by_quest', (q: any) => q.eq('questId', questId)).collect()
  for (const d of deps) if (!completed.has(d.requiresQuestId)) return false
  return true
}

// listAll удалён: видимость теперь управляется только серверной логикой listVisible

export const listVisible = query({
  args: { deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const subject = await getIdentitySubject(ctx)
    const deviceId = args.deviceId
    const player = await getPlayerStateSafe(ctx, deviceId)
    const phase = player?.phase ?? 0
    const { active, completed } = await getQuestSets(ctx, subject, deviceId)
    // eslint-disable-next-line no-console
    console.info('[MAPPOINTS][visible] args', { deviceId, subject, phase, activeCount: active.size, completedCount: completed.size })

    // Меты квестов, разрешённые по требованиям и фазе
    const { metas, allowed: allowedMeta } = await computeAllowedQuestMetaIds(ctx as any, player)
    // eslint-disable-next-line no-console
    console.info('[MAPPOINTS][visible] metas', { total: metas.length, allowed: allowedMeta.size })

    // Стартовые биндинги: выбираем ТОЛЬКО стартовые биндинги для разрешённых квестов (индекс `by_quest_start`)
    const bindings: any[] = []
    for (const questId of allowedMeta) {
      const rows = await ctx.db
        .query('mappoint_bindings')
        .withIndex('by_quest_start', (q: any) => q.eq('questId', questId).eq('isStart', true))
        .collect()
      if (rows.length) bindings.push(...rows)
    }
    const startBindings = await selectStartBindings(
      ctx as any,
      bindings,
      allowedMeta,
      phase,
      active,
      completed,
      async (questId) => await dependenciesSatisfied(ctx, questId, completed),
    )
    // eslint-disable-next-line no-console
    console.info('[MAPPOINTS][visible] bindings', { total: bindings.length, start: startBindings.length })

    const pointKeys = Array.from(new Set(startBindings.map((b) => b.pointKey)))
    const results: any[] = []
    for (const key of pointKeys) {
      const p = await ctx.db.query('map_points').withIndex('by_key', (q: any) => q.eq('key', key)).unique()
      if (p) results.push(p)
    }
    // eslint-disable-next-line no-console
    console.info('[MAPPOINTS][visible] points', { pointKeys: pointKeys.length, returned: results.length })
    return results
  },
})

// Dev: детальная диагностика отбора стартовых точек
export const listVisibleDebug = query({
  args: { deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const subject = await getIdentitySubject(ctx)
    const deviceId = args.deviceId
    const player = await getPlayerStateSafe(ctx, deviceId)
    const phase = player?.phase ?? 0
    const { active, completed } = await getQuestSets(ctx, subject, deviceId)

    const { metas, allowed: allowedMeta } = await computeAllowedQuestMetaIds(ctx as any, player)
    const disallowedMeta: Array<{ questId: string; reason: string }> = []
    for (const m of metas) {
      if (!requirementsSatisfied(m.requirements, player)) { disallowedMeta.push({ questId: m.questId, reason: 'requirements' }); continue }
      if (typeof m.phaseGate === 'number' && phase < m.phaseGate) { disallowedMeta.push({ questId: m.questId, reason: 'phaseGate' }); continue }
    }

    // Выбираем только стартовые биндинги по разрешённым квестам (индекс `by_quest_start`)
    const bindings: any[] = []
    for (const questId of allowedMeta) {
      const rows = await ctx.db
        .query('mappoint_bindings')
        .withIndex('by_quest_start', (q: any) => q.eq('questId', questId).eq('isStart', true))
        .collect()
      if (rows.length) bindings.push(...rows)
    }
    const { startBindings, excluded: excludedBindings } = await diagnoseStartBindings(
      ctx as any,
      bindings,
      allowedMeta,
      phase,
      active,
      completed,
      async (questId) => await dependenciesSatisfied(ctx, questId, completed),
    )

    const pointKeys = Array.from(new Set(startBindings.map((b) => b.pointKey)))
    const results: any[] = []
    for (const key of pointKeys) {
      const p = await ctx.db.query('map_points').withIndex('by_key', (q: any) => q.eq('key', key)).unique()
      if (p) results.push(p)
    }

    return {
      subject,
      deviceId,
      phase,
      activeQuestIds: Array.from(active),
      completedQuestIds: Array.from(completed),
      allowedQuestIds: Array.from(allowedMeta),
      disallowedMeta,
      totalBindings: bindings.length,
      startBindings,
      excludedBindings,
      pointKeys,
      points: results,
    }
  },
})

export const upsertManyDev = mutation({
  args: {
    devToken: v.string(),
    points: v.array(
      v.object({
        key: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        coordinates: v.object({ lat: v.number(), lng: v.number() }),
        type: v.optional(v.string()),
        dialogKey: v.optional(v.string()),
        questId: v.optional(v.string()),
        active: v.boolean(),
        radius: v.optional(v.number()),
        icon: v.optional(v.string()),
      }),
    ),
  },
  handler: async ({ db }, { devToken, points }) => {
    const expected = (globalThis as any)?.process?.env?.VITE_DEV_SEED_TOKEN ?? (globalThis as any)?.VITE_DEV_SEED_TOKEN
    if (!expected || devToken !== expected) throw new Error('Forbidden: invalid dev token')
    const now = Date.now()
    let count = 0
    for (const p of points) {
      const existing = await db.query('map_points').withIndex('by_key', (q: any) => q.eq('key', p.key)).unique()
      if (existing) await db.patch(existing._id, { ...p, updatedAt: now })
      else await db.insert('map_points', { ...p, updatedAt: now })
      count++
    }
    return { ok: true, count }
  },
})


