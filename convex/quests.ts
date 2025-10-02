import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { Doc, Id } from './_generated/dataModel'

// Получить или создать игрока по deviceId
async function getOrCreatePlayer(ctx: any, deviceId: string, userId?: string) {
  // Сначала ищем по deviceId
  let player = await ctx.db
    .query('players')
    .withIndex('by_deviceId', (q: any) => q.eq('deviceId', deviceId))
    .first()

  if (!player && userId) {
    // Если не нашли по deviceId, ищем по userId
    player = await ctx.db
      .query('players')
      .withIndex('by_userId', (q: any) => q.eq('userId', userId))
      .first()
  }

  if (!player) {
    // Создаем нового игрока
    const now = Date.now()
    const insertedId = await ctx.db.insert('players', {
      deviceId,
      userId,
      name: `Игрок ${deviceId.slice(0, 8)}`,
      fame: 0,
      phase: 1,
      createdAt: now,
      updatedAt: now
    })
    const created = await ctx.db.get(insertedId)
    return created as any
  }

  return player
}

// Read-only helper to find a player (use in queries)
async function findPlayer(ctx: any, deviceId: string, userId?: string) {
  let player = await ctx.db
    .query('players')
    .withIndex('by_deviceId', (q: any) => q.eq('deviceId', deviceId))
    .first()

  if (!player && userId) {
    player = await ctx.db
      .query('players')
      .withIndex('by_userId', (q: any) => q.eq('userId', userId))
      .first()
  }

  return player
}

// Получить активные квесты игрока
export const getActiveQuests = query({
  args: {
    deviceId: v.string(),
    userId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const player = await findPlayer(ctx, args.deviceId, args.userId)
    if (!player) return []

    const progressRecords = await ctx.db
      .query('quest_progress')
      .withIndex('by_player', (q: any) => q.eq('playerId', player._id))
      .filter((q: any) => q.neq(q.field('completedAt'), undefined))
      .collect()

    return progressRecords.map(record => ({
      id: record.questId,
      currentStep: record.currentStep,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
      progress: record.progress
    }))
  },
})

// Получить статистику квестов игрока
export const getQuestStats = query({
  args: {
    deviceId: v.string(),
    userId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const player = await findPlayer(ctx, args.deviceId, args.userId)
    if (!player) {
      return {
        completedQuests: 0,
        totalQuests: 0,
        completionRate: 0,
        activeQuests: 0,
      }
    }

    const progressRecords = await ctx.db
      .query('quest_progress')
      .withIndex('by_player', (q: any) => q.eq('playerId', player._id))
      .collect()

    const completedCount = progressRecords.filter(r => r.completedAt).length
    const totalCount = progressRecords.length

    return {
      completedQuests: completedCount,
      totalQuests: totalCount,
      completionRate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
      activeQuests: totalCount - completedCount
    }
  },
})

// Получить доступные квесты для текущей фазы игрока
export const getAvailableQuests = query({
  args: {
    deviceId: v.string(),
    userId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const player = await findPlayer(ctx, args.deviceId, args.userId)
    if (!player) return []

    // Получаем активные квесты игрока для проверки предусловий
    const activeProgress = await ctx.db
      .query('quest_progress')
      .withIndex('by_player', (q: any) => q.eq('playerId', player._id))
      .collect()

    const completedQuestIds = new Set(
      activeProgress
        .filter(p => p.completedAt)
        .map(p => p.questId)
    )

    // Получаем все активные квесты текущей фазы
    const availableQuests = await ctx.db
      .query('quests')
      .withIndex('by_phase', (q: any) => q.eq('phase', player.phase))
      .filter((q: any) => q.eq(q.field('isActive'), true))
      .collect()

    // Фильтруем квесты по предусловиям
    return availableQuests.filter(quest => {
      // Проверяем, что все предусловия выполнены
      return quest.prerequisites.every(prereqId => completedQuestIds.has(prereqId))
    })
  },
})

// Начать квест
export const startQuest = mutation({
  args: {
    deviceId: v.string(),
    userId: v.optional(v.string()),
    questId: v.string(),
    initialStep: v.string()
  },
  handler: async (ctx, args) => {
    const player = await getOrCreatePlayer(ctx, args.deviceId, args.userId)

    // Проверяем, что квест существует и доступен
    const quest = await ctx.db
      .query('quests')
      .filter((q: any) => q.eq(q.field('id'), args.questId))
      .filter((q: any) => q.eq(q.field('isActive'), true))
      .first()

    if (!quest) {
      throw new Error(`Квест ${args.questId} не найден или неактивен`)
    }

    // Проверяем предусловия
    if (quest.prerequisites.length > 0) {
      const completedQuests = await ctx.db
        .query('quest_progress')
      .withIndex('by_player', (q: any) => q.eq('playerId', player._id))
        .filter((q: any) => q.eq(q.field('completedAt'), undefined))
        .collect()

      const completedIds = new Set(completedQuests.map(p => p.questId))
      const hasPrerequisites = quest.prerequisites.every(id => completedIds.has(id))

      if (!hasPrerequisites) {
        throw new Error(`Не выполнены предусловия для квеста ${args.questId}`)
      }
    }

    // Проверяем, что квест еще не начат
    const existingProgress = await ctx.db
      .query('quest_progress')
      .withIndex('by_player_quest', (q: any) =>
        q.eq('playerId', player._id).eq('questId', args.questId)
      )
      .first()

    if (existingProgress) {
      throw new Error(`Квест ${args.questId} уже начат`)
    }

    // Создаем запись о прогрессе
    const now = Date.now()
    const progressId = await ctx.db.insert('quest_progress', {
      playerId: player._id,
      questId: args.questId,
      currentStep: args.initialStep,
      startedAt: now,
      completedAt: undefined,
      progress: {},
      updatedAt: now
    })

    return {
      success: true,
      progressId,
      quest: {
        id: quest.id,
        title: quest.title,
        currentStep: args.initialStep,
        startedAt: now
      }
    }
  },
})

// Обновить прогресс квеста
export const updateQuestProgress = mutation({
  args: {
    deviceId: v.string(),
    userId: v.optional(v.string()),
    questId: v.string(),
    newStep: v.string(),
    progressData: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const player = await getOrCreatePlayer(ctx, args.deviceId, args.userId)

    // Находим запись о прогрессе
    const progressRecord = await ctx.db
      .query('quest_progress')
      .withIndex('by_player_quest', (q: any) =>
        q.eq('playerId', player._id).eq('questId', args.questId)
      )
      .first()

    if (!progressRecord) {
      throw new Error(`Квест ${args.questId} не найден в прогрессе игрока`)
    }

    if (progressRecord.completedAt) {
      throw new Error(`Квест ${args.questId} уже завершен`)
    }

    // Проверяем, что квест существует
    const quest = await ctx.db
      .query('quests')
      .filter((q: any) => q.eq(q.field('id'), args.questId))
      .first()

    if (!quest) {
      throw new Error(`Квест ${args.questId} не найден`)
    }

    // Проверяем, что шаг существует в квесте
    const stepExists = quest.steps.some(step => step.id === args.newStep)
    if (!stepExists) {
      throw new Error(`Шаг ${args.newStep} не найден в квесте ${args.questId}`)
    }

    // Обновляем прогресс
    const now = Date.now()
    await ctx.db.patch(progressRecord._id, {
      currentStep: args.newStep,
      progress: args.progressData || progressRecord.progress,
      updatedAt: now
    })

    return {
      success: true,
      quest: {
        id: quest.id,
        title: quest.title,
        currentStep: args.newStep,
        updatedAt: now
      }
    }
  },
})

// Завершить квест
export const completeQuest = mutation({
  args: {
    deviceId: v.string(),
    userId: v.optional(v.string()),
    questId: v.string(),
    finalStep: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const player = await getOrCreatePlayer(ctx, args.deviceId, args.userId)

    // Находим запись о прогрессе
    const progressRecord = await ctx.db
      .query('quest_progress')
      .withIndex('by_player_quest', (q: any) =>
        q.eq('playerId', player._id).eq('questId', args.questId)
      )
      .first()

    if (!progressRecord) {
      throw new Error(`Квест ${args.questId} не найден в прогрессе игрока`)
    }

    if (progressRecord.completedAt) {
      throw new Error(`Квест ${args.questId} уже завершен`)
    }

    // Получаем информацию о квесте для начисления наград
    const quest = await ctx.db
      .query('quests')
      .filter((q: any) => q.eq(q.field('id'), args.questId))
      .first()

    if (!quest) {
      throw new Error(`Квест ${args.questId} не найден`)
    }

    const now = Date.now()
    const finalStep = args.finalStep || progressRecord.currentStep

    // Завершаем квест
    await ctx.db.patch(progressRecord._id, {
      completedAt: now,
      currentStep: finalStep,
      updatedAt: now
    })

    // Начисляем награды (пока только fame)
    if (quest.rewards.fame > 0) {
      await ctx.db.patch(player._id, {
        fame: player.fame + quest.rewards.fame,
        updatedAt: now
      })
    }

    return {
      success: true,
      quest: {
        id: quest.id,
        title: quest.title,
        completedAt: now,
        rewards: quest.rewards
      }
    }
  },
})

// Синхронизировать состояние квестов с клиентом (batch операция)
export const syncQuestState = mutation({
  args: {
    deviceId: v.string(),
    userId: v.optional(v.string()),
    questUpdates: v.array(v.object({
      questId: v.string(),
      currentStep: v.optional(v.string()),
      completedAt: v.optional(v.number()),
      progressData: v.optional(v.any())
    }))
  },
  handler: async (ctx, args) => {
    const player = await getOrCreatePlayer(ctx, args.deviceId, args.userId)
    const results = []

    for (const update of args.questUpdates) {
      try {
        // Находим существующую запись
        const existingProgress = await ctx.db
          .query('quest_progress')
      .withIndex('by_player_quest', (q: any) =>
        q.eq('playerId', player._id).eq('questId', update.questId)
      )
      .first()

        const now = Date.now()

        if (existingProgress) {
          // Обновляем существующую запись
          const patchData: any = {
            updatedAt: now
          }

          if (update.currentStep) {
            patchData.currentStep = update.currentStep
          }

          if (update.progressData) {
            patchData.progress = update.progressData
          }

          if (update.completedAt) {
            patchData.completedAt = update.completedAt
          }

          await ctx.db.patch(existingProgress._id, patchData)
        } else if (update.currentStep) {
          // Создаем новую запись
          await ctx.db.insert('quest_progress', {
            playerId: player._id,
            questId: update.questId,
            currentStep: update.currentStep,
            startedAt: now,
            completedAt: update.completedAt,
            progress: update.progressData || {},
            updatedAt: now
          })
        }

        results.push({
          questId: update.questId,
          success: true
        })
      } catch (error) {
        results.push({
          questId: update.questId,
          success: false,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        })
      }
    }

    return {
      success: true,
      results,
      playerId: player._id
    }
  },
})
