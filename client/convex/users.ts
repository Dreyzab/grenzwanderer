import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    return user
  },
})

export const createUser = mutation({
  args: {
    email: v.string(),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (existingUser) return existingUser

    const userId = await ctx.db.insert('users', {
      clerkId: identity.subject,
      email: args.email,
      username: args.username,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return await ctx.db.get(userId)
  },
})
