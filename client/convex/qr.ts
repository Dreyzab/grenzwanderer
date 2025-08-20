import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { filterQuestsByRequirements, loadQuestDependencies, dependenciesSatisfied } from './quests.helpers.ts'

export const resolvePoint = query({
  args: { code: v.string(), deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async ({ db, auth }, { code, deviceId, userId }) => {
    const identity = await auth.getUserIdentity()
    const resolvedUserId = userId ?? identity?.subject ?? undefined
    const qr = await db.query('qr_codes').withIndex('by_code', (q) => q.eq('code', code)).unique()
    if (!qr) return { status: 'not_found' as const }
    const point = await db.query('map_points').withIndex('by_key', (q) => q.eq('key', qr.pointKey)).unique()
    if (!point || !point.active) return { status: 'point_inactive' as const }

    const player = resolvedUserId
      ? await db.query('player_state').withIndex('by_user', (q) => q.eq('userId', resolvedUserId)).unique()
      : deviceId
      ? await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId!)).unique()
      : null
    const world = await db.query('world_state').withIndex('by_key', (q) => q.eq('key', 'global')).unique()
    const progress = resolvedUserId
      ? await db.query('quest_progress').withIndex('by_user', (q) => q.eq('userId', resolvedUserId)).collect()
      : deviceId
      ? await db.query('quest_progress').withIndex('by_device', (q) => q.eq('deviceId', deviceId!)).collect()
      : []
    const done = new Set(progress.filter((p: any) => p.completedAt).map((p: any) => p.questId))
    const deps = await loadQuestDependencies(db)
    const bindings = await db.query('mappoint_bindings').withIndex('by_point', (q) => q.eq('pointKey', qr.pointKey)).collect()
    const metas = await db.query('quest_registry').collect()
    const metaById = new Map<string, any>(metas.map((m: any) => [m.questId, m]))
    const phaseContext = (world as any) ?? { phase: player?.phase ?? 0 }
    const allowed = filterQuestsByRequirements(
      bindings
        .map((b) => metaById.get(b.questId))
        .filter((m): m is any => Boolean(m)),
      (player as any) ?? null,
      phaseContext as any,
      done,
    )
    const allowedIds = new Set(allowed.map((m) => m.questId))
    const candidates = bindings
      .filter((b) => allowedIds.has(b.questId))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const chosen = candidates.find((b) => dependenciesSatisfied(b.questId, done, deps))

    const hasPda = Boolean((player as any)?.hasPda)
    const nextAction = hasPda ? 'open_point' : 'start_intro_vn'

    return {
      status: 'ok' as const,
      point: {
        key: point.key,
        title: point.title,
        dialogKey: (chosen as any)?.dialogKey ?? point.dialogKey,
        questId: (chosen as any)?.questId ?? point.questId,
        coordinates: point.coordinates,
        eventKey: (chosen as any)?.startKey,
        npcId: (chosen as any)?.npcId,
      },
      hasPda,
      nextAction,
    }
  },
})

export const grantPda = mutation({
  args: { deviceId: v.string() },
  handler: async ({ db }, { deviceId }) => {
    const player = await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).unique()
    const now = Date.now()
    if (player) {
      await db.patch(player._id, { hasPda: true, updatedAt: now })
      return player._id
    }
    return db.insert('player_state', {
      deviceId,
      userId: undefined,
      phase: 1,
      status: 'refugee',
      inventory: [],
      hasPda: true,
      fame: 0,
      reputations: {},
      relationships: {},
      flags: [],
      updatedAt: now,
    })
  },
})


