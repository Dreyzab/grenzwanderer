import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const listVisiblePoints = query({
  args: {
    phaseRequirement: v.optional(v.number()),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const points = await ctx.db
      .query('map_points')
      .filter((q) =>
        q.and(
          q.eq(q.field('isVisible'), true),
          q.neq(q.field('phaseRequirement'), args.phaseRequirement || 1)
        )
      )
      .collect()

    return points
  },
})

export const getPointByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('map_points')
      .filter((q) => q.eq(q.field('key'), args.key))
      .first()
  },
})

export const createMapPoint = mutation({
  args: {
    key: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    coordinates: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    type: v.union(
      v.literal('quest'),
      v.literal('npc'),
      v.literal('location'),
      v.literal('anomaly')
    ),
    phaseRequirement: v.optional(v.number()),
    questBinding: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pointId = await ctx.db.insert('map_points', {
      ...args,
      isVisible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return await ctx.db.get(pointId)
  },
})

export const seedDevMapPoints = mutation({
  args: {},
  handler: async (ctx) => {
    const existingPoints = await ctx.db.query('map_points').collect()
    if (existingPoints.length > 0) return existingPoints

    const devPoints = [
      {
        key: 'freiburg_cathedral',
        title: 'Фрайбургский собор',
        description: 'Исторический центр города',
        coordinates: { lat: 47.9959, lng: 7.8522 },
        type: 'location' as const,
        phaseRequirement: 1,
      },
      {
        key: 'old_town_hall',
        title: 'Старая ратуша',
        description: 'Административное здание',
        coordinates: { lat: 47.9962, lng: 7.8528 },
        type: 'location' as const,
        phaseRequirement: 1,
      },
      {
        key: 'university_library',
        title: 'Университетская библиотека',
        description: 'Место исследований',
        coordinates: { lat: 47.9945, lng: 7.8470 },
        type: 'location' as const,
        phaseRequirement: 1,
      },
    ]

    const createdPoints = []
    for (const point of devPoints) {
      const pointId = await ctx.db.insert('map_points', {
        ...point,
        isVisible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      createdPoints.push(await ctx.db.get(pointId))
    }

    return createdPoints
  },
})
