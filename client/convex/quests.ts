import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const getPlayerQuests = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('quest_progress')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()
  },
})

export const getAvailableQuests = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('quest_registry')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect()
  },
})

export const startQuest = mutation({
  args: {
    userId: v.id('users'),
    questId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingProgress = await ctx.db
      .query('quest_progress')
      .withIndex('by_user_quest', (q) =>
        q.eq('userId', args.userId).eq('questId', args.questId)
      )
      .first()

    if (existingProgress) return existingProgress

    const questId = await ctx.db.insert('quest_progress', {
      userId: args.userId,
      questId: args.questId,
      status: 'in_progress',
      progress: {},
      startedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return await ctx.db.get(questId)
  },
})

export const completeQuest = mutation({
  args: {
    userId: v.id('users'),
    questId: v.string(),
  },
  handler: async (ctx, args) => {
    const questProgress = await ctx.db
      .query('quest_progress')
      .withIndex('by_user_quest', (q) =>
        q.eq('userId', args.userId).eq('questId', args.questId)
      )
      .first()

    if (!questProgress) throw new Error('Quest progress not found')

    await ctx.db.patch(questProgress._id, {
      status: 'completed',
      completedAt: Date.now(),
      updatedAt: Date.now(),
    })

    return await ctx.db.get(questProgress._id)
  },
})

export const seedDevQuests = mutation({
  args: {},
  handler: async (ctx) => {
    const existingQuests = await ctx.db.query('quest_registry').collect()
    if (existingQuests.length > 0) return existingQuests

    const devQuests = [
      {
        id: 'intro_to_freiburg',
        title: 'Знакомство с Фрайбургом',
        description: 'Исследуйте исторический центр города и узнайте о его прошлом',
        type: 'main' as const,
        requirements: {
          minPhase: 1,
          prerequisites: [],
        },
        rewards: {
          experience: 100,
          reputation: { exploration: 10 },
          items: [],
        },
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'first_battle',
        title: 'Первая битва',
        description: 'Проведите свой первый карточный бой',
        type: 'side' as const,
        requirements: {
          minPhase: 1,
          prerequisites: [],
        },
        rewards: {
          experience: 50,
          reputation: { combat: 5 },
          items: [],
        },
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]

    const createdQuests = []
    for (const quest of devQuests) {
      const questId = await ctx.db.insert('quest_registry', quest)
      createdQuests.push(await ctx.db.get(questId))
    }

    return createdQuests
  },
})
