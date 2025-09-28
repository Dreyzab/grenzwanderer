import { query } from './_generated/server'
import { v } from 'convex/values'

export const getActive = query({
  args: { userId: v.optional(v.string()) },
  handler: async (_ctx, _args) => {
    // TODO: Implement actual active quest retrieval once quest collection exists
    return []
  },
})

export const getStats = query({
  args: { userId: v.optional(v.string()) },
  handler: async (_ctx, _args) => {
    // TODO: Aggregate quest stats from persistent store
    return {
      completedQuests: 0,
      totalQuests: 0,
      completionRate: 0,
    }
  },
})

