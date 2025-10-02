import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// Helper function: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Get visible map points for current user
export const listVisible = query({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    bbox: v.optional(v.object({
      minLat: v.number(),
      maxLat: v.number(),
      minLng: v.number(),
      maxLng: v.number(),
    })),
    phase: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { deviceId, userId, bbox, phase, limit = 100 } = args

    // Query active map points
    let pointsQuery = ctx.db.query('map_points')
      .filter((q) => q.eq(q.field('isActive'), true))

    // Filter by phase if specified
    if (phase !== undefined) {
      pointsQuery = pointsQuery.filter((q) => 
        q.or(
          q.eq(q.field('phase'), phase),
          q.eq(q.field('phase'), undefined)
        )
      )
    }

    // Get points (we'll filter by bbox in memory for better performance)
    const allPoints = await pointsQuery.take(limit * 2)

    // Filter by bounding box if provided
    let filteredPoints = allPoints
    if (bbox) {
      filteredPoints = allPoints.filter(point => 
        point.coordinates.lat >= bbox.minLat &&
        point.coordinates.lat <= bbox.maxLat &&
        point.coordinates.lng >= bbox.minLng &&
        point.coordinates.lng <= bbox.maxLng
      )
    }

    // Limit results
    const limitedPoints = filteredPoints.slice(0, limit)

    // Get discovery status for each point
    const pointsWithStatus = await Promise.all(
      limitedPoints.map(async (point) => {
        // Query discovery record
        let discoveryQuery = ctx.db.query('point_discoveries')
          .filter((q) => q.eq(q.field('pointKey'), point.id))

        if (deviceId) {
          discoveryQuery = discoveryQuery.filter((q) => 
            q.eq(q.field('deviceId'), deviceId)
          )
        } else if (userId) {
          discoveryQuery = discoveryQuery.filter((q) => 
            q.eq(q.field('userId'), userId)
          )
        }

        const discovery = await discoveryQuery.first()

        return {
          ...point,
          status: discovery?.researchedAt ? 'researched' as const :
                  discovery?.discoveredAt ? 'discovered' as const : 'not_found' as const,
          discoveredAt: discovery?.discoveredAt,
          researchedAt: discovery?.researchedAt,
          discoveredBy: discovery?.deviceId || discovery?.userId,
        }
      })
    )

    return {
      points: pointsWithStatus,
      ttlMs: 5 * 60 * 1000, // 5 minutes cache
      timestamp: Date.now(),
    }
  },
})

// Mark point as researched
export const markResearched = mutation({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    pointKey: v.string(),
  },
  handler: async (ctx, args) => {
    const { deviceId, userId, pointKey } = args

    if (!deviceId && !userId) {
      throw new Error('Either deviceId or userId must be provided')
    }

    // Verify point exists
    const point = await ctx.db
      .query('map_points')
      .filter((q) => q.eq(q.field('id'), pointKey))
      .first()

    if (!point) {
      throw new Error('Map point not found')
    }

    // Find or create discovery record
    let discoveryQuery = ctx.db.query('point_discoveries')
      .filter((q) => q.eq(q.field('pointKey'), pointKey))

    if (deviceId) {
      discoveryQuery = discoveryQuery.filter((q) => 
        q.eq(q.field('deviceId'), deviceId)
      )
    } else if (userId) {
      discoveryQuery = discoveryQuery.filter((q) => 
        q.eq(q.field('userId'), userId)
      )
    }

    const existing = await discoveryQuery.first()
    const now = Date.now()

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        researchedAt: now,
        updatedAt: now,
      })
    } else {
      // Create new record
      await ctx.db.insert('point_discoveries', {
        deviceId,
        userId,
        pointKey,
        discoveredAt: now,
        researchedAt: now,
        updatedAt: now,
      })
    }

    return {
      success: true,
      pointKey,
      researchedAt: now,
      timestamp: Date.now(),
    }
  },
})

// Get points within radius from position
export const getPointsInRadius = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.optional(v.number()),
    type: v.optional(v.union(
      v.literal('poi'),
      v.literal('quest'),
      v.literal('npc'),
      v.literal('location')
    )),
    phase: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { lat, lng, radiusKm = 1, type, phase, limit = 50 } = args

    // Get all active points
    let pointsQuery = ctx.db.query('map_points')
      .filter((q) => q.eq(q.field('isActive'), true))

    if (type) {
      pointsQuery = pointsQuery.filter((q) => q.eq(q.field('type'), type))
    }

    if (phase !== undefined) {
      pointsQuery = pointsQuery.filter((q) => 
        q.or(
          q.eq(q.field('phase'), phase),
          q.eq(q.field('phase'), undefined)
        )
      )
    }

    const allPoints = await pointsQuery.take(1000)

    // Filter by distance
    const pointsInRadius = allPoints
      .map(point => ({
        ...point,
        distance: calculateDistance(
          lat, lng,
          point.coordinates.lat, point.coordinates.lng
        )
      }))
      .filter(point => point.distance <= radiusKm * 1000)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)

    return {
      points: pointsInRadius,
      totalCount: pointsInRadius.length,
      radiusKm,
      center: { lat, lng },
    }
  },
})

// Get discovery statistics for player
export const getDiscoveryStats = query({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { deviceId, userId } = args

    if (!deviceId && !userId) {
      return {
        totalDiscovered: 0,
        totalResearched: 0,
        byType: {},
        byPhase: {},
        recentDiscoveries: [],
      }
    }

    // Get all discoveries for player
    let discoveriesQuery = ctx.db.query('point_discoveries')

    if (deviceId) {
      discoveriesQuery = discoveriesQuery.filter((q) => 
        q.eq(q.field('deviceId'), deviceId)
      )
    } else if (userId) {
      discoveriesQuery = discoveriesQuery.filter((q) => 
        q.eq(q.field('userId'), userId)
      )
    }

    const discoveries = await discoveriesQuery.collect()

    // Get point information
    const pointKeys = [...new Set(discoveries.map(d => d.pointKey))]
    const points = await Promise.all(
      pointKeys.map(key =>
        ctx.db.query('map_points')
          .filter((q) => q.eq(q.field('id'), key))
          .first()
      )
    )

    const pointsMap = new Map(
      points.filter((p): p is NonNullable<typeof p> => p !== null).map(p => [p.id, p])
    )

    // Calculate statistics
    const stats = {
      totalDiscovered: discoveries.filter(d => d.discoveredAt).length,
      totalResearched: discoveries.filter(d => d.researchedAt).length,
      byType: {} as Record<string, number>,
      byPhase: {} as Record<number, number>,
      recentDiscoveries: discoveries
        .filter(d => d.discoveredAt)
        .sort((a, b) => b.discoveredAt - a.discoveredAt)
        .slice(0, 10)
        .map(d => {
          const point = pointsMap.get(d.pointKey)
          return {
            pointKey: d.pointKey,
            pointTitle: point?.title || 'Unknown Point',
            discoveredAt: d.discoveredAt,
            researchedAt: d.researchedAt,
            type: point?.type,
            coordinates: point?.coordinates,
          }
        }),
    }

    // Count by type and phase
    discoveries.forEach(discovery => {
      const point = pointsMap.get(discovery.pointKey)
      if (point) {
        stats.byType[point.type] = (stats.byType[point.type] || 0) + 1
        
        if (point.phase !== undefined) {
          stats.byPhase[point.phase] = (stats.byPhase[point.phase] || 0) + 1
        }
      }
    })

    return stats
  },
})

