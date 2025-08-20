import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { computeAvailableQuests, pickWinnerProgress, isQuestAllowedByPhase, loadQuestDependencies, dependenciesSatisfied } from './quests.helpers'

// ===== Универсальная выдача доступных квестов по источнику (NPC/доски/объекты) =====
export const getAvailableQuests = query({
  args: {
    sourceType: v.union(v.literal('npc'), v.literal('board')),
    sourceKey: v.string(),
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async ({ db }, { sourceType, sourceKey, deviceId, userId }) => {
    const base = await computeAvailableQuests(db, sourceType, sourceKey, deviceId, userId)
    const deps = await loadQuestDependencies(db)
    const progress = await db
      .query('quest_progress')
      .withIndex(userId ? 'by_user' : 'by_device', (q: any) => (userId ? q.eq('userId', userId) : q.eq('deviceId', deviceId)))
      .collect()
    const done = new Set(progress.filter((p: any) => p.completedAt).map((p: any) => p.questId))
    return base.filter((q) => dependenciesSatisfied(q.questId, done, deps))
  },
})

// ===== Прогресс квестов =====
export const getProgress = query({
  args: { deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async ({ db, auth }, { deviceId, userId }) => {
    const identity = await auth.getUserIdentity()
    const resolvedUserId = userId ?? identity?.subject ?? undefined
    if (resolvedUserId) {
      return db.query('quest_progress').withIndex('by_user', (q) => q.eq('userId', resolvedUserId)).collect()
    }
    if (deviceId) {
      return db.query('quest_progress').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).collect()
    }
    return []
  },
})

// ===== Состояние игрока (фаза) =====
export const getPlayerState = query({
  args: { deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async ({ db, auth }, { deviceId, userId }) => {
    const identity = await auth.getUserIdentity()
    const resolvedUserId = userId ?? identity?.subject ?? undefined
    if (resolvedUserId) {
      const row = await db.query('player_state').withIndex('by_user', (q) => q.eq('userId', resolvedUserId)).unique()
      return row ?? null
    }
    if (deviceId) {
      const row = await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).unique()
      return row ?? null
    }
    return null
  },
})

export const setPlayerPhase = mutation({
  args: { deviceId: v.string(), phase: v.number() },
  handler: async ({ db, auth }, { deviceId, phase }) => {
    const identity = await auth.getUserIdentity()
    const userId = identity?.subject
    const existing = await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).unique()
    const now = Date.now()
    if (existing) {
      await db.patch(existing._id, { phase, updatedAt: now, userId: userId ?? existing.userId })
      return existing._id
    }
    return db.insert('player_state', {
      deviceId,
      userId: userId ?? undefined,
      phase,
      status: 'refugee',
      inventory: ['rags', '1x_canned_food'],
      fame: 0,
      reputations: {},
      relationships: {},
      flags: [],
      updatedAt: now,
    })
  },
})

// Bootstrap нового игрока
export const bootstrapNewPlayer = mutation({
  args: { deviceId: v.string() },
  handler: async ({ db }, { deviceId }) => {
    const existing = await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).unique()
    const now = Date.now()
    if (existing) return existing._id
    const world = await db.query('world_state').withIndex('by_key', (q) => q.eq('key', 'global')).unique()
    if (!world) await db.insert('world_state', { key: 'global', phase: 0, flags: [], updatedAt: now })
    return db.insert('player_state', {
      deviceId,
      userId: undefined,
      phase: 0,
      status: 'refugee',
      inventory: ['item_canned_food'],
      fame: 0,
      reputations: {},
      relationships: {},
      flags: [],
      updatedAt: now,
    })
  },
})

export const startQuest = mutation({
  args: { deviceId: v.string(), questId: v.string(), step: v.string() },
  handler: async ({ db }, { deviceId, questId, step }) => {
    const st = await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).unique()
    const phase = st?.phase ?? 0
    const metaById = new Map<string, any>((await db.query('quest_registry').collect()).map((m: any) => [m.questId, m]))
    if (!isQuestAllowedByPhase(phase, questId, metaById)) {
      throw new Error(`Quest ${questId} is not allowed in phase ${phase}`)
    }
    const existing = await db.query('quest_progress').withIndex('by_device_quest', (q) => q.eq('deviceId', deviceId).eq('questId', questId)).unique()
    const now = Date.now()
    if (existing) {
      if (existing.completedAt) return existing._id
      await db.patch(existing._id, { currentStep: step, updatedAt: now })
      return existing._id
    }
    return db.insert('quest_progress', { deviceId, userId: undefined, questId, currentStep: step, startedAt: now, updatedAt: now, completedAt: undefined })
  },
})

export const advanceQuest = mutation({
  args: { deviceId: v.string(), questId: v.string(), step: v.string() },
  handler: async ({ db }, { deviceId, questId, step }) => {
    const existing = await db.query('quest_progress').withIndex('by_device_quest', (q) => q.eq('deviceId', deviceId).eq('questId', questId)).unique()
    const now = Date.now()
    if (!existing) {
      return db.insert('quest_progress', { deviceId, userId: undefined, questId, currentStep: step, startedAt: now, updatedAt: now, completedAt: undefined })
    }
    await db.patch(existing._id, { currentStep: step, updatedAt: now })
    return existing._id
  },
})

export const completeQuest = mutation({
  args: { deviceId: v.string(), questId: v.string() },
  handler: async ({ db }, { deviceId, questId }) => {
    const existing = await db.query('quest_progress').withIndex('by_device_quest', (q) => q.eq('deviceId', deviceId).eq('questId', questId)).unique()
    const now = Date.now()
    if (!existing) {
      return db.insert('quest_progress', { deviceId, userId: undefined, questId, currentStep: 'completed', startedAt: now, updatedAt: now, completedAt: now })
    }
    await db.patch(existing._id, { currentStep: 'completed', updatedAt: now, completedAt: now })
    return existing._id
  },
})

export const migrateDeviceProgressToUser = mutation({
  args: { deviceId: v.string(), userId: v.string() },
  handler: async ({ db }, { deviceId, userId }) => {
    const now = Date.now()
    const u = await db.query('users').withIndex('by_externalId', (q) => q.eq('externalId', userId)).unique()
    if (!u) await db.insert('users', { externalId: userId, createdAt: now, updatedAt: now })
    else await db.patch(u._id, { updatedAt: now })
    const deviceProgress = await db.query('quest_progress').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).collect()
    for (const dp of deviceProgress) {
      const existingForUser = await db.query('quest_progress').withIndex('by_user_quest', (q) => q.eq('userId', userId).eq('questId', dp.questId)).unique()
      if (!existingForUser) await db.patch(dp._id, { userId })
      else {
        const { winner, loser } = pickWinnerProgress(dp, existingForUser)
        await db.patch(winner._id, { userId, updatedAt: now })
        await db.delete(loser._id)
      }
    }
    const devicePlayer = await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).unique()
    if (devicePlayer) {
      const userPlayer = await db.query('player_state').withIndex('by_user', (q) => q.eq('userId', userId)).unique()
      if (!userPlayer) await db.patch(devicePlayer._id, { userId, updatedAt: now })
      else {
        const winner = (devicePlayer.updatedAt ?? 0) >= (userPlayer.updatedAt ?? 0) ? devicePlayer : userPlayer
        const loser = winner === devicePlayer ? userPlayer : devicePlayer
        await db.patch(winner._id, { userId, updatedAt: now })
        await db.delete(loser._id)
      }
    }
    return { migrated: deviceProgress.length }
  },
})

// ===== Глобальное состояние мира =====
export const getWorldState = query({
  args: {},
  handler: async ({ db }) => {
    const row = await db.query('world_state').withIndex('by_key', (q) => q.eq('key', 'global')).unique()
    return row ?? null
  },
})

export const setWorldPhase = mutation({
  args: { phase: v.number() },
  handler: async ({ db }, { phase }) => {
    const existing = await db.query('world_state').withIndex('by_key', (q) => q.eq('key', 'global')).unique()
    const now = Date.now()
    if (existing) {
      await db.patch(existing._id, { phase, updatedAt: now })
      return existing._id
    }
    return db.insert('world_state', { key: 'global', phase, flags: [], updatedAt: now })
  },
})

// ===== Хабы выдачи
export const getAvailableQuestsForNpc = query({
  args: { npcId: v.string(), deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async ({ db, auth }, { npcId, deviceId }) => {
    const identity = await auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')
    return computeAvailableQuests(db, 'npc', npcId, deviceId, userId)
  },
})

export const getAvailableBoardQuests = query({
  args: { boardKey: v.string(), deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async ({ db, auth }, { boardKey, deviceId }) => {
    const identity = await auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')
    return computeAvailableQuests(db, 'board', boardKey, deviceId, userId)
  },
})

// ===== Применение исходов
export const applyOutcome = mutation({
  args: {
    deviceId: v.string(),
    fameDelta: v.optional(v.number()),
    reputationsDelta: v.optional(v.record(v.string(), v.number())),
    relationshipsDelta: v.optional(v.record(v.string(), v.number())),
    addFlags: v.optional(v.array(v.string())),
    removeFlags: v.optional(v.array(v.string())),
    addWorldFlags: v.optional(v.array(v.string())),
    removeWorldFlags: v.optional(v.array(v.string())),
    setPhase: v.optional(v.number()),
    setStatus: v.optional(v.string()),
  },
  handler: async ({ db }, args) => {
    const { deviceId } = args
    const player = await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).unique()
    const now = Date.now()
    if (!player) throw new Error('Player state not found')
    const nextFlags = new Set(player.flags ?? [])
    for (const f of args.addFlags ?? []) nextFlags.add(f)
    for (const f of args.removeFlags ?? []) nextFlags.delete(f)
    const nextReps = { ...(player.reputations ?? {}) }
    for (const k of Object.keys(args.reputationsDelta ?? {})) {
      nextReps[k] = (nextReps[k] ?? 0) + (args.reputationsDelta![k] as number)
      nextReps[k] = Math.max(-100, Math.min(100, nextReps[k]!))
    }
    const nextRels = { ...(player.relationships ?? {}) }
    for (const k of Object.keys(args.relationshipsDelta ?? {})) {
      nextRels[k] = Math.max(0, Math.min(100, (nextRels[k] ?? 0) + (args.relationshipsDelta![k] as number)))
    }
    await db.patch(player._id, {
      fame: (player.fame ?? 0) + (args.fameDelta ?? 0),
      reputations: nextReps,
      relationships: nextRels,
      flags: Array.from(nextFlags),
      phase: args.setPhase != null ? args.setPhase : player.phase,
      status: args.setStatus != null ? args.setStatus : player.status,
      updatedAt: now,
    })
    const world = await db.query('world_state').withIndex('by_key', (q) => q.eq('key', 'global')).unique()
    const wNext = new Set(world?.flags ?? [])
    for (const f of args.addWorldFlags ?? []) wNext.add(f)
    for (const f of args.removeWorldFlags ?? []) wNext.delete(f)
    if (world) await db.patch(world._id, { flags: Array.from(wNext), updatedAt: now })
    else if ((args.addWorldFlags && args.addWorldFlags.length) || (args.removeWorldFlags && args.removeWorldFlags.length)) {
      await db.insert('world_state', { key: 'global', phase: 1, flags: Array.from(wNext), updatedAt: now })
    }
    return { ok: true }
  },
})

export const upsertQuestRegistry = mutation({
  args: {
    questId: v.string(),
    type: v.union(v.literal('story'), v.literal('faction'), v.literal('personal'), v.literal('procedural')),
    giverNpcId: v.optional(v.string()),
    boardKey: v.optional(v.string()),
    repeatable: v.optional(v.boolean()),
    priority: v.number(),
    phaseGate: v.optional(v.number()),
    requirements: v.optional(
      v.object({
        fameMin: v.optional(v.number()),
        phaseMin: v.optional(v.number()),
        phaseMax: v.optional(v.number()),
        requiredFlags: v.optional(v.array(v.string())),
        forbiddenFlags: v.optional(v.array(v.string())),
        reputations: v.optional(v.record(v.string(), v.number())),
        relationships: v.optional(v.record(v.string(), v.number())),
      }),
    ),
  },
  handler: async ({ db }, meta) => {
    const existing = await db.query('quest_registry').withIndex('by_quest', (q) => q.eq('questId', meta.questId)).unique()
    const now = Date.now()
    if (existing) {
      await db.patch(existing._id, { ...meta, updatedAt: now })
      return existing._id
    }
    return db.insert('quest_registry', { ...meta, updatedAt: now })
  },
})

export const finalizeRegistration = mutation({
  args: { deviceId: v.string(), nickname: v.string(), avatarKey: v.optional(v.string()) },
  handler: async ({ db, auth }, { deviceId, nickname }) => {
    const identity = await auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')
    const now = Date.now()
    const existingUser = await db.query('users').withIndex('by_externalId', (q) => q.eq('externalId', identity.subject)).unique()
    if (existingUser) await db.patch(existingUser._id, { name: nickname, updatedAt: now })
    else await db.insert('users', { externalId: identity.subject, name: nickname, createdAt: now, updatedAt: now })
    const deviceProgress = await db.query('quest_progress').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).collect()
    for (const dp of deviceProgress) {
      const existingForUser = await db
        .query('quest_progress')
        .withIndex('by_user_quest', (q) => q.eq('userId', identity.subject).eq('questId', dp.questId))
        .unique()
      if (!existingForUser) await db.patch(dp._id, { userId: identity.subject })
      else {
        const { winner, loser } = pickWinnerProgress(dp, existingForUser)
        await db.patch(winner._id, { userId: identity.subject, updatedAt: now })
        await db.delete(loser._id)
      }
    }
    const deviceState = await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).unique()
    if (deviceState) await db.patch(deviceState._id, { userId: identity.subject, phase: 1, updatedAt: now })
    else await db.insert('player_state', { deviceId, userId: identity.subject, phase: 1, status: 'refugee', inventory: [], fame: 0, reputations: {}, relationships: {}, flags: [], updatedAt: now })
    const world = await db.query('world_state').withIndex('by_key', (q) => q.eq('key', 'global')).unique()
    if (world) await db.patch(world._id, { phase: 1, updatedAt: now })
    else await db.insert('world_state', { key: 'global', phase: 1, flags: [], updatedAt: now })
    return { ok: true }
  },
})


