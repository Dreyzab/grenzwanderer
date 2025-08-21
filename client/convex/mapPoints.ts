import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

export const listAll = query({
  args: {},
  handler: async ({ db }) => {
    const pts = await db.query('map_points').collect()
    return pts
  },
})

export const listVisible = query({
  args: { deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async ({ db }, _args) => {
    // Пока без bbox: фронтенд сам фильтрует по фазам/правилам, сервер отдаёт активные точки
    const pts = await db.query('map_points').withIndex('by_active', (q: any) => q.eq('active', true)).collect()
    return pts
  },
})

export const upsertManyDev = mutation({
  args: {
    devToken: v.string(),
    points: v.array(
      v.object({
        key: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        coordinates: v.object({ lat: v.number(), lng: v.number() }),
        type: v.optional(v.string()),
        dialogKey: v.optional(v.string()),
        questId: v.optional(v.string()),
        active: v.boolean(),
        radius: v.optional(v.number()),
        icon: v.optional(v.string()),
      }),
    ),
  },
  handler: async ({ db }, { devToken, points }) => {
    const expected = (globalThis as any)?.process?.env?.VITE_DEV_SEED_TOKEN ?? (globalThis as any)?.VITE_DEV_SEED_TOKEN
    if (!expected || devToken !== expected) throw new Error('Forbidden: invalid dev token')
    const now = Date.now()
    let count = 0
    for (const p of points) {
      const existing = await db.query('map_points').withIndex('by_key', (q: any) => q.eq('key', p.key)).unique()
      if (existing) await db.patch(existing._id, { ...p, updatedAt: now })
      else await db.insert('map_points', { ...p, updatedAt: now })
      count++
    }
    return { ok: true, count }
  },
})


