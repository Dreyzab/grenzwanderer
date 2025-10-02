import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

export const bootstrap = mutation({
  handler: async (ctx) => {
    // TODO: create or fetch player record once auth is wired
    return { status: 'ok' }
  }
})

export const getProfile = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // TODO: implement real fetch after auth is connected
    const { db } = ctx
    if (args.userId) {
      const player = await db
        .query('players')
        .withIndex('by_userId', (q) => q.eq('userId', args.userId!))
        .unique()
      return player ?? null
    }

    const firstPlayer = await db.query('players').first()
    return firstPlayer ?? null
  }
})

export const getStats = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { db } = ctx

    let player = null
    if (args.userId) {
      player = await db
        .query('players')
        .withIndex('by_userId', (q) => q.eq('userId', args.userId!))
        .unique()
    } else {
      player = await db.query('players').first()
    }

    return {
      completedQuests: 0,
      totalQuests: 0,
      currentPhase: player?.phase ?? 1,
      experienceGained: player?.fame ?? 0,
      daysSinceStart: 1,
    }
  }
})

