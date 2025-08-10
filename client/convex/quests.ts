import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// @deprecated демо-эндпоинты (оставлены для совместимости, не используются основным потоком)
export const list = query(async ({ db }) => db.query('quests').order('desc').take(100))
export const create = mutation({
  args: { title: v.string() },
  handler: async ({ db }, { title }) => db.insert('quests', { title, status: 'new', createdAt: Date.now() }),
})

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

export const startQuest = mutation({
  args: { deviceId: v.string(), questId: v.string(), step: v.string() },
  handler: async ({ db }, { deviceId, questId, step }) => {
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


