import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const list = query(async ({ db }) => {
  return await db.query('quests').order('desc').take(100)
})

export const create = mutation({
  args: { title: v.string() },
  handler: async ({ db }, { title }) => {
    const id = await db.insert('quests', {
      title,
      status: 'new',
      createdAt: Date.now(),
    })
    return id
  },
})


