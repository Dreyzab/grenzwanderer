import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

/**
 * Сохранение прогресса в визуальной новелле
 * Использует deviceId для анонимных игроков и userId для авторизованных
 */
export const saveProgress = mutation({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    currentScene: v.string(),
    visitedScenes: v.array(v.string()),
    flags: v.any(), // Record<string, any>
  },
  handler: async (ctx, args) => {
    const { deviceId, userId, currentScene, visitedScenes, flags } = args

    if (!deviceId && !userId) {
      throw new Error('Either deviceId or userId must be provided')
    }

    // Ищем существующий прогресс
    let progressQuery = ctx.db.query('game_progress')

    if (deviceId) {
      progressQuery = progressQuery.filter((q) => 
        q.eq(q.field('deviceId'), deviceId)
      )
    } else if (userId) {
      progressQuery = progressQuery.filter((q) => 
        q.eq(q.field('userId'), userId)
      )
    }

    const existing = await progressQuery.first()
    const now = Date.now()

    if (existing) {
      // Обновляем существующий прогресс
      await ctx.db.patch(existing._id, {
        currentScene,
        visitedScenes,
        flags,
        updatedAt: now,
      })
      
      return {
        success: true,
        progressId: existing._id,
        updated: true,
      }
    } else {
      // Создаём новый прогресс
      const progressId = await ctx.db.insert('game_progress', {
        deviceId,
        userId,
        currentScene,
        visitedScenes,
        flags,
        createdAt: now,
        updatedAt: now,
      })

      return {
        success: true,
        progressId,
        updated: false,
      }
    }
  },
})

/**
 * Загрузка прогресса игры
 */
export const loadProgress = query({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { deviceId, userId } = args

    if (!deviceId && !userId) {
      return null
    }

    // Ищем прогресс
    let progressQuery = ctx.db.query('game_progress')

    if (deviceId) {
      progressQuery = progressQuery.filter((q) => 
        q.eq(q.field('deviceId'), deviceId)
      )
    } else if (userId) {
      progressQuery = progressQuery.filter((q) => 
        q.eq(q.field('userId'), userId)
      )
    }

    const progress = await progressQuery.first()

    if (!progress) {
      return null
    }

    return {
      currentScene: progress.currentScene,
      visitedScenes: progress.visitedScenes,
      flags: progress.flags,
      createdAt: progress.createdAt,
      updatedAt: progress.updatedAt,
    }
  },
})

/**
 * Установка флага игры
 */
export const setFlag = mutation({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const { deviceId, userId, key, value } = args

    if (!deviceId && !userId) {
      throw new Error('Either deviceId or userId must be provided')
    }

    // Ищем прогресс
    let progressQuery = ctx.db.query('game_progress')

    if (deviceId) {
      progressQuery = progressQuery.filter((q) => 
        q.eq(q.field('deviceId'), deviceId)
      )
    } else if (userId) {
      progressQuery = progressQuery.filter((q) => 
        q.eq(q.field('userId'), userId)
      )
    }

    const progress = await progressQuery.first()
    const now = Date.now()

    if (progress) {
      // Обновляем существующие флаги
      const updatedFlags = {
        ...progress.flags,
        [key]: value,
      }

      await ctx.db.patch(progress._id, {
        flags: updatedFlags,
        updatedAt: now,
      })

      return {
        success: true,
        flags: updatedFlags,
      }
    } else {
      // Создаём новый прогресс с флагом
      const newFlags = { [key]: value }
      
      await ctx.db.insert('game_progress', {
        deviceId,
        userId,
        currentScene: 'prologue_start', // Начальная сцена по умолчанию
        visitedScenes: [],
        flags: newFlags,
        createdAt: now,
        updatedAt: now,
      })

      return {
        success: true,
        flags: newFlags,
      }
    }
  },
})

/**
 * Получение значения флага
 */
export const getFlag = query({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const { deviceId, userId, key } = args

    if (!deviceId && !userId) {
      return null
    }

    // Ищем прогресс
    let progressQuery = ctx.db.query('game_progress')

    if (deviceId) {
      progressQuery = progressQuery.filter((q) => 
        q.eq(q.field('deviceId'), deviceId)
      )
    } else if (userId) {
      progressQuery = progressQuery.filter((q) => 
        q.eq(q.field('userId'), userId)
      )
    }

    const progress = await progressQuery.first()

    if (!progress || !progress.flags) {
      return null
    }

    return progress.flags[key] ?? null
  },
})

/**
 * Сброс прогресса игры (для начала новой игры)
 */
export const resetProgress = mutation({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { deviceId, userId } = args

    if (!deviceId && !userId) {
      throw new Error('Either deviceId or userId must be provided')
    }

    // Ищем прогресс
    let progressQuery = ctx.db.query('game_progress')

    if (deviceId) {
      progressQuery = progressQuery.filter((q) => 
        q.eq(q.field('deviceId'), deviceId)
      )
    } else if (userId) {
      progressQuery = progressQuery.filter((q) => 
        q.eq(q.field('userId'), userId)
      )
    }

    const progress = await progressQuery.first()

    if (progress) {
      await ctx.db.delete(progress._id)
    }

    return {
      success: true,
      reset: true,
    }
  },
})

/**
 * Получение статистики прогресса
 */
export const getProgressStats = query({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { deviceId, userId } = args

    if (!deviceId && !userId) {
      return {
        scenesVisited: 0,
        flagsSet: 0,
        hasProgress: false,
      }
    }

    // Ищем прогресс
    let progressQuery = ctx.db.query('game_progress')

    if (deviceId) {
      progressQuery = progressQuery.filter((q) => 
        q.eq(q.field('deviceId'), deviceId)
      )
    } else if (userId) {
      progressQuery = progressQuery.filter((q) => 
        q.eq(q.field('userId'), userId)
      )
    }

    const progress = await progressQuery.first()

    if (!progress) {
      return {
        scenesVisited: 0,
        flagsSet: 0,
        hasProgress: false,
      }
    }

    return {
      scenesVisited: progress.visitedScenes?.length ?? 0,
      flagsSet: Object.keys(progress.flags ?? {}).length,
      hasProgress: true,
      currentScene: progress.currentScene,
      lastUpdated: progress.updatedAt,
    }
  },
})

