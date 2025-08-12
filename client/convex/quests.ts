import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// ===== Прогресс квестов (промежуточная реализация на deviceId) =====

export const getProgress = query({
  args: { deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async ({ db }, { deviceId, userId }) => {
    if (userId) {
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
  handler: async ({ db }, { deviceId, userId }) => {
    if (userId) {
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
  handler: async ({ db }, { deviceId, phase }) => {
    const existing = await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).unique()
    const now = Date.now()
    if (existing) {
      await db.patch(existing._id, { phase, updatedAt: now })
      return existing._id
    }
    return db.insert('player_state', {
      deviceId,
      userId: undefined,
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
    // Разрешаем старт всех квестов своей фазы, квесты фазы 1 остаются доступны и в фазе 2
    const phase1 = new Set<string>([
      'delivery_and_dilemma',
      'field_medicine',
      'combat_baptism',
      'quiet_cove_whisper',
      'bell_for_lost',
    ])
    // Разрешаем старт квестов фазы 2 только при фазе >= 2
    const phase2 = new Set<string>([
      'citizenship_invitation',
      'eyes_in_the_dark',
      'void_shards',
      'water_crisis',
      'loyalty_fjr',
      'freedom_spark',
    ])
    const allowed = phase >= 2 ? new Set<string>([...phase1, ...phase2]) : phase1
    if (!allowed.has(questId)) {
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
    const deviceProgress = await db
      .query('quest_progress')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .collect()

    for (const dp of deviceProgress) {
      // Проверим, нет ли записи для userId по этому квесту
      const existingForUser = await db
        .query('quest_progress')
        .withIndex('by_user_quest', (q) => q.eq('userId', userId).eq('questId', dp.questId))
        .unique()

      if (!existingForUser) {
        await db.patch(dp._id, { userId })
        continue
      }

      // Слить записи: приоритет completed, иначе более свежая updatedAt
      const choose = (a: any, b: any) => {
        if (a.completedAt && !b.completedAt) return a
        if (b.completedAt && !a.completedAt) return b
        return (a.updatedAt ?? 0) >= (b.updatedAt ?? 0) ? a : b
      }
      const winner = choose(dp, existingForUser)
      const loser = winner === dp ? existingForUser : dp

      await db.patch(winner._id, {
        userId,
        currentStep: winner.currentStep,
        updatedAt: Date.now(),
        completedAt: winner.completedAt,
      })
      // Удаляем дубликат
      await db.delete(loser._id)
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
    const player = userId
      ? await db.query('player_state').withIndex('by_user', (q) => q.eq('userId', userId)).unique()
      : deviceId
      ? await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).unique()
      : null
    const world = await db.query('world_state').withIndex('by_key', (q) => q.eq('key', 'global')).unique()
    const progress = userId
      ? await db.query('quest_progress').withIndex('by_user', (q) => q.eq('userId', userId)).collect()
      : deviceId
      ? await db.query('quest_progress').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).collect()
      : []

    const done = new Set(progress.filter((p: any) => p.completedAt).map((p: any) => p.questId))

    const all = await db.query('quest_registry').withIndex('by_giver', (q) => q.eq('giverNpcId', npcId)).collect()
    const filtered = all
      .filter((qmeta: any) => {
        if (!player || !world) return false
        if (qmeta.phaseGate != null && world.phase < qmeta.phaseGate) return false
        if (!qmeta.repeatable && done.has(qmeta.questId)) return false
        const req = qmeta.requirements ?? {}
        if (req.phaseMin != null && player.phase < req.phaseMin) return false
        if (req.phaseMax != null && player.phase > req.phaseMax) return false
        if (req.fameMin != null && (player.fame ?? 0) < req.fameMin) return false
        if (req.requiredFlags) {
          const have = new Set(player.flags ?? [])
          for (const fl of req.requiredFlags) if (!have.has(fl)) return false
        }
        if (req.forbiddenFlags) {
          const have = new Set(player.flags ?? [])
          for (const fl of req.forbiddenFlags) if (have.has(fl)) return false
        }
        if (req.reputations) {
          for (const k of Object.keys(req.reputations)) {
            const min = req.reputations[k]!
            if (((player.reputations ?? {})[k] ?? 0) < min) return false
          }
        }
        if (req.relationships) {
          for (const k of Object.keys(req.relationships)) {
            const min = req.relationships[k]!
            if (((player.relationships ?? {})[k] ?? 0) < min) return false
          }
        }
        return true
      })
      .sort((a: any, b: any) => b.priority - a.priority)

    return filtered
  },
})

export const getAvailableBoardQuests = query({
  args: { boardKey: v.string(), deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async ({ db }, { boardKey, deviceId, userId }) => {
    const player = userId
      ? await db.query('player_state').withIndex('by_user', (q) => q.eq('userId', userId)).unique()
      : deviceId
      ? await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).unique()
      : null
    const world = await db.query('world_state').withIndex('by_key', (q) => q.eq('key', 'global')).unique()
    const progress = userId
      ? await db.query('quest_progress').withIndex('by_user', (q) => q.eq('userId', userId)).collect()
      : deviceId
      ? await db.query('quest_progress').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).collect()
      : []

    const done = new Set(progress.filter((p: any) => p.completedAt).map((p: any) => p.questId))

    const all = await db.query('quest_registry').withIndex('by_board', (q) => q.eq('boardKey', boardKey)).collect()
    const filtered = all
      .filter((qmeta: any) => {
        if (!player || !world) return false
        if (qmeta.phaseGate != null && world.phase < qmeta.phaseGate) return false
        if (!qmeta.repeatable && done.has(qmeta.questId)) return false
        const req = qmeta.requirements ?? {}
        if (req.phaseMin != null && player.phase < req.phaseMin) return false
        if (req.phaseMax != null && player.phase > req.phaseMax) return false
        if (req.fameMin != null && (player.fame ?? 0) < req.fameMin) return false
        if (req.requiredFlags) {
          const have = new Set(player.flags ?? [])
          for (const f of req.requiredFlags) if (!have.has(f)) return false
        }
        if (req.forbiddenFlags) {
          const have = new Set(player.flags ?? [])
          for (const f of req.forbiddenFlags) if (have.has(f)) return false
        }
        if (req.reputations) {
          for (const k of Object.keys(req.reputations)) {
            const min = req.reputations[k]!
            if (((player.reputations ?? {})[k] ?? 0) < min) return false
          }
        }
        if (req.relationships) {
          for (const k of Object.keys(req.relationships)) {
            const min = req.relationships[k]!
            if (((player.relationships ?? {})[k] ?? 0) < min) return false
          }
        }
        return true
      })
      .sort((a: any, b: any) => b.priority - a.priority)

    return filtered
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
    type: v.string(),
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
    const expected = (globalThis as any)?.process?.env?.VITE_DEV_SEED_TOKEN ?? (globalThis as any)?.VITE_DEV_SEED_TOKEN
    if (!expected || devToken !== expected) {
      throw new Error('Forbidden: invalid dev token')
    }
    const metas = [
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


