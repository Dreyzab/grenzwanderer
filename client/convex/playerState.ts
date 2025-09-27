import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const getPlayerState = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('player_state')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first()
  },
})

export const createPlayerState = mutation({
  args: {
    userId: v.id('users'),
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const playerId = await ctx.db.insert('player_state', {
      userId: args.userId,
      deviceId: args.deviceId,
      currentPhase: 1,
      reputation: {
        combat: 0,
        exploration: 0,
        social: 0,
        reliability: 0,
      },
      inventory: {},
      lastSyncAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return await ctx.db.get(playerId)
  },
})

export const updatePlayerState = mutation({
  args: {
    userId: v.id('users'),
    updates: v.any(),
  },
  handler: async (ctx, args) => {
    const playerState = await ctx.db
      .query('player_state')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first()

    if (!playerState) throw new Error('Player state not found')

    await ctx.db.patch(playerState._id, {
      ...args.updates,
      updatedAt: Date.now(),
    })

    return await ctx.db.get(playerState._id)
  },
})

export const updateLocation = mutation({
  args: {
    userId: v.id('users'),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      accuracy: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const playerState = await ctx.db
      .query('player_state')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first()

    if (!playerState) throw new Error('Player state not found')

    await ctx.db.patch(playerState._id, {
      currentLocation: args.location,
      lastSyncAt: Date.now(),
      updatedAt: Date.now(),
    })

    return await ctx.db.get(playerState._id)
  },
})
