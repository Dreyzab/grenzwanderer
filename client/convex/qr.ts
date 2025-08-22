import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { WORLD_KEYS, PLAYER_STATUS, QR_RESOLVE_STATUS, NEXT_ACTION } from './constants'
import { choosePointBinding } from './helpers/qr'

// Локальные хелперы удалены: используем helpers/quest

export const resolvePoint = query({
  args: { code: v.string(), deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async ({ db, auth }, { code, deviceId, userId }) => {
    const identity = await auth.getUserIdentity()
    const resolvedUserId = userId ?? identity?.subject ?? undefined
    const qr = await db.query('qr_codes').withIndex('by_code', (q) => q.eq('code', code)).unique()
    if (!qr) return { status: QR_RESOLVE_STATUS.NOT_FOUND }
    const point = await db.query('map_points').withIndex('by_key', (q) => q.eq('key', qr.pointKey)).unique()
    if (!point || !point.active) return { status: QR_RESOLVE_STATUS.POINT_INACTIVE }

    const player = resolvedUserId
      ? await db.query('player_state').withIndex('by_user', (q) => q.eq('userId', resolvedUserId)).unique()
      : deviceId
      ? await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId!)).unique()
      : null
    const world = await db.query('world_state').withIndex('by_key', (q) => q.eq('key', WORLD_KEYS.GLOBAL)).unique()
    const progress = resolvedUserId
      ? await db.query('quest_progress').withIndex('by_user', (q) => q.eq('userId', resolvedUserId)).collect()
      : deviceId
      ? await db.query('quest_progress').withIndex('by_device', (q) => q.eq('deviceId', deviceId!)).collect()
      : []
    const done = new Set(progress.filter((p: any) => p.completedAt).map((p: any) => p.questId))
    const { chosen } = await choosePointBinding({ db } as any, qr.pointKey, player, world, done)

    const hasPda = Boolean((player as any)?.hasPda)
    const nextAction = hasPda ? NEXT_ACTION.OPEN_POINT : NEXT_ACTION.START_INTRO_VN

    return {
      status: QR_RESOLVE_STATUS.OK,
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
      playerState: player
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
      status: PLAYER_STATUS.REFUGEE,
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


