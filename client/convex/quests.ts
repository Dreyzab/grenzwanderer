import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { computeAvailableQuests, pickWinnerProgress, isQuestAllowedByPhase } from './quests.helpers'

// ===== Constants & simple helpers =====
// (helpers moved to quests.helpers)
// ===== Универсальная выдача доступных квестов по источнику (NPC/доски/объекты) =====
export const getAvailableQuests = query({
  args: {
    sourceType: v.union(v.literal('npc'), v.literal('board')),
    sourceKey: v.string(),
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async ({ db }, { sourceType, sourceKey, deviceId, userId }) => {
    return computeAvailableQuests(db, sourceType, sourceKey, deviceId, userId)
  },
})


// ===== Прогресс квестов (промежуточная реализация на deviceId) =====

export const getProgress = query({
  args: { deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async ({ db, auth }, { deviceId, userId }) => {
    // Автоматическая аутентификация через Convex providers
    const identity = await auth.getUserIdentity()
    const resolvedUserId = userId ?? identity?.subject ?? undefined
    if (resolvedUserId) {
      return db.query('quest_progress').withIndex('by_user', (q) => q.eq('userId', userId)).collect()
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
      const row = await db.query('player_state').withIndex('by_user', (q) => q.eq('userId', userId)).unique()
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

export const startQuest = mutation({
  args: { deviceId: v.string(), questId: v.string(), step: v.string() },
  handler: async ({ db }, { deviceId, questId, step }) => {
    // Простая серверная валидация по фазе
    const st = await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).unique()
    const phase = st?.phase ?? 0
    if (!isQuestAllowedByPhase(phase, questId)) {
      throw new Error(`Quest ${questId} is not allowed in phase ${phase}`)
    }
    const existing = await db
      .query('quest_progress')
      .withIndex('by_device_quest', (q) => q.eq('deviceId', deviceId).eq('questId', questId))
      .unique()
    const now = Date.now()
    if (existing) {
      if (existing.completedAt) return existing._id
      await db.patch(existing._id, { currentStep: step, updatedAt: now })
      return existing._id
    }
    return db.insert('quest_progress', {
      deviceId,
      userId: undefined,
      questId,
      currentStep: step,
      startedAt: now,
      updatedAt: now,
      completedAt: undefined,
    })
  },
})

export const advanceQuest = mutation({
  args: { deviceId: v.string(), questId: v.string(), step: v.string() },
  handler: async ({ db }, { deviceId, questId, step }) => {
    const existing = await db
      .query('quest_progress')
      .withIndex('by_device_quest', (q) => q.eq('deviceId', deviceId).eq('questId', questId))
      .unique()
    const now = Date.now()
    if (!existing) {
      return db.insert('quest_progress', {
        deviceId,
        userId: undefined,
        questId,
        currentStep: step,
        startedAt: now,
        updatedAt: now,
        completedAt: undefined,
      })
    }
    await db.patch(existing._id, { currentStep: step, updatedAt: now })
    return existing._id
  },
})

export const completeQuest = mutation({
  args: { deviceId: v.string(), questId: v.string() },
  handler: async ({ db }, { deviceId, questId }) => {
    const existing = await db
      .query('quest_progress')
      .withIndex('by_device_quest', (q) => q.eq('deviceId', deviceId).eq('questId', questId))
      .unique()
    const now = Date.now()
    if (!existing) {
      return db.insert('quest_progress', {
        deviceId,
        userId: undefined,
        questId,
        currentStep: 'completed',
        startedAt: now,
        updatedAt: now,
        completedAt: now,
      })
    }
    await db.patch(existing._id, { currentStep: 'completed', updatedAt: now, completedAt: now })
    return existing._id
  },
})

// Миграция прогресса: deviceId -> userId (для привязки к аккаунту)
export const migrateDeviceProgressToUser = mutation({
  args: { deviceId: v.string(), userId: v.string() },
  handler: async ({ db }, { deviceId, userId }) => {
    // Обновим/создадим запись в users под внешний/анонимный идентификатор
    const now = Date.now()
    const externalId = userId
    const u = await db.query('users').withIndex('by_externalId', (q) => q.eq('externalId', externalId)).unique()
    if (!u) {
      await db.insert('users', { externalId, createdAt: now, updatedAt: now })
    } else {
      await db.patch(u._id, { updatedAt: now })
    }
    const deviceProgress = await db
      .query('quest_progress')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .collect()

    for (const dp of deviceProgress) {
      const existingForUser = await db
        .query('quest_progress')
        .withIndex('by_user_quest', (q) => q.eq('userId', userId).eq('questId', dp.questId))
        .unique()

      if (!existingForUser) {
        await db.patch(dp._id, { userId })
        continue
      }

      const { winner, loser } = pickWinnerProgress(dp, existingForUser)

      await db.patch(winner._id, {
        userId,
        currentStep: winner.currentStep,
        updatedAt: Date.now(),
        completedAt: winner.completedAt,
      })
      await db.delete(loser._id)
    }

    // Миграция состояния игрока (player_state)
    const devicePlayer = await db
      .query('player_state')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .unique()

    if (devicePlayer) {
      const userPlayer = await db
        .query('player_state')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .unique()

      if (!userPlayer) {
        // Привязываем текущее состояние к userId
        await db.patch(devicePlayer._id, { userId, updatedAt: Date.now() })
      } else {
        // Слить состояния: выбираем более «свежее»
        const winner = (devicePlayer.updatedAt ?? 0) >= (userPlayer.updatedAt ?? 0) ? devicePlayer : userPlayer
        const loser = winner === devicePlayer ? userPlayer : devicePlayer
        await db.patch(winner._id, {
          userId,
          phase: winner.phase,
          status: winner.status,
          inventory: winner.inventory,
          fame: winner.fame,
          reputation: winner.reputation,
          reputations: winner.reputations,
          relationships: winner.relationships,
          flags: winner.flags,
          updatedAt: Date.now(),
        })
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

// ===== Реестр квестов и выдача через хабы =====
export const getAvailableQuestsForNpc = query({
  args: { npcId: v.string(), deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async ({ db }, { npcId, deviceId, userId }) => {
    return computeAvailableQuests(db, 'npc', npcId, deviceId, userId)
  },
})

export const getAvailableBoardQuests = query({
  args: { boardKey: v.string(), deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async ({ db }, { boardKey, deviceId, userId }) => {
    return computeAvailableQuests(db, 'board', boardKey, deviceId, userId)
  },
})

// ===== Применение исходов (fame/rep/relations/flags/phase/status) =====
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

    if (world) {
      await db.patch(world._id, { flags: Array.from(wNext), updatedAt: now })
    } else if ((args.addWorldFlags && args.addWorldFlags.length) || (args.removeWorldFlags && args.removeWorldFlags.length)) {
      await db.insert('world_state', { key: 'global', phase: 1, flags: Array.from(wNext), updatedAt: now })
    }

    return { ok: true }
  },
})

// ===== Админ/сервис: upsert записи в реестре квестов =====
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

// Dev-only helper: cид реестра квестов
export const seedQuestRegistryDev = mutation({
  args: { devToken: v.string() },
  handler: async ({ db }, { devToken }) => {
    const expected = (globalThis as any)?.process?.env?.VITE_DEV_SEED_TOKEN
    if (!expected || devToken !== expected) {
      throw new Error('Forbidden: invalid dev token')
    }
    const metas: Array<{
      questId: string
      type: 'story' | 'faction' | 'personal' | 'procedural'
      giverNpcId?: string
      boardKey?: string
      repeatable?: boolean
      priority: number
      phaseGate?: number
      requirements?: {
        fameMin?: number
        phaseMin?: number
        phaseMax?: number
        requiredFlags?: string[]
        forbiddenFlags?: string[]
        reputations?: Record<string, number>
        relationships?: Record<string, number>
      }
    }> = [
      {
        questId: 'delivery_and_dilemma',
        type: 'story',
        giverNpcId: 'hans',
        priority: 100,
        phaseGate: 1,
        requirements: { phaseMin: 1 },
      },
      {
        questId: 'field_medicine',
        type: 'faction',
        giverNpcId: 'synthesis_medbay_npc',
        priority: 60,
        phaseGate: 1,
        requirements: { phaseMin: 1 },
      },
      {
        questId: 'combat_baptism',
        type: 'faction',
        boardKey: 'fjr_board',
        priority: 50,
        phaseGate: 1,
        requirements: { phaseMin: 1 },
      },
      {
        questId: 'quiet_cove_whisper',
        type: 'faction',
        giverNpcId: 'quiet_cove_bartender',
        priority: 40,
        phaseGate: 1,
        requirements: { phaseMin: 1 },
      },
      {
        questId: 'bell_for_lost',
        type: 'faction',
        giverNpcId: 'cathedral_priest',
        priority: 30,
        phaseGate: 1,
        requirements: { phaseMin: 1 },
      },
      {
        questId: 'citizenship_invitation',
        type: 'story',
        giverNpcId: 'rathaus_mayor',
        priority: 100,
        phaseGate: 2,
        requirements: { fameMin: 50, phaseMin: 1 },
      },
      {
        questId: 'eyes_in_the_dark',
        type: 'story',
        giverNpcId: 'seepark_scientist',
        priority: 80,
        phaseGate: 2,
        requirements: { phaseMin: 2 },
      },
      {
        questId: 'void_shards',
        type: 'story',
        giverNpcId: 'wasserschlossle_curator',
        priority: 70,
        phaseGate: 2,
        requirements: { phaseMin: 2 },
      },
      {
        questId: 'water_crisis',
        type: 'story',
        giverNpcId: 'gunter',
        priority: 90,
        phaseGate: 2,
        requirements: { phaseMin: 2 },
      },
      {
        questId: 'loyalty_fjr',
        type: 'faction',
        giverNpcId: 'hans',
        priority: 65,
        phaseGate: 2,
        requirements: { phaseMin: 2 },
      },
      {
        questId: 'freedom_spark',
        type: 'faction',
        giverNpcId: 'odin',
        priority: 65,
        phaseGate: 2,
        requirements: { phaseMin: 2 },
      },
    ]

    const now = Date.now()
    for (const meta of metas) {
      const existing = await db.query('quest_registry').withIndex('by_quest', (q) => q.eq('questId', meta.questId)).unique()
      if (existing) {
        await db.patch(existing._id, { ...meta, updatedAt: now })
      } else {
        await db.insert('quest_registry', { ...meta, updatedAt: now })
      }
    }

    // Ensure global world_state exists
    const world = await db.query('world_state').withIndex('by_key', (q) => q.eq('key', 'global')).unique()
    if (!world) {
      await db.insert('world_state', { key: 'global', phase: 1, flags: [], updatedAt: now })
    }

    return { ok: true, count: metas.length }
  },
})

// (helpers moved to quests.helpers.ts)


