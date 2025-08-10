import { internalMutation, mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const listAll = query(async ({ db }) => {
  return db.query('map_points').withIndex('by_active', (q) => q.eq('active', true)).collect()
})

export const listVisible = query({
  args: { deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async ({ db }, { deviceId, userId }) => {
    const points = await db.query('map_points').withIndex('by_active', (q) => q.eq('active', true)).collect()
    let progresses = [] as any[]
    if (userId) {
      progresses = await db.query('quest_progress').withIndex('by_user', (q) => q.eq('userId', userId)).collect()
    } else if (deviceId) {
      progresses = await db.query('quest_progress').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).collect()
    }

    const getStep = (questId: string): string | 'not_started' => {
      const p = progresses.find((x) => x.questId === questId)
      if (!p) return 'not_started'
      if (p.completedAt) return 'completed'
      return p.currentStep
    }

    const deliveryStep = getStep('delivery_and_dilemma')
    const loyaltyStep = getStep('loyalty_fjr')
    const waterStep = getStep('water_crisis')
    const freedomStep = getStep('freedom_spark')

    const filtered = points.filter((p) => {
      if (loyaltyStep === 'go_to_hole') return p.key === 'anarchist_hole'

      if (waterStep === 'need_to_talk_to_gunter') return p.key === 'gunter_brewery'
      if (waterStep === 'talk_to_travers') return p.key === 'city_gate_travers'
      if (waterStep === 'got_proof' || waterStep === 'final_talk_with_gunter') return p.key === 'gunter_brewery'

      if (freedomStep === 'talk_to_odin') return p.key === 'anarchist_bar'
      if (freedomStep === 'find_rivet') return p.key === 'anarchist_arena_basement'
      if (freedomStep === 'friendship_final') return p.key === 'anarchist_bar'
      if (freedomStep === 'order_final') return p.key === 'carl_private_workshop'

      if (deliveryStep === 'not_started') return p.dialogKey === 'quest_start_dialog'
      if (deliveryStep === 'need_pickup_from_trader') return p.dialogKey === 'trader_meeting_dialog'
      if (deliveryStep === 'deliver_parts_to_craftsman' || deliveryStep === 'artifact_offer')
        return p.dialogKey === 'craftsman_meeting_dialog'
      if (deliveryStep === 'go_to_anomaly') return p.dialogKey === 'anomaly_exploration_dialog'
      if (deliveryStep === 'return_to_craftsman') return p.dialogKey === 'craftsman_meeting_dialog'
      if (deliveryStep === 'completed') return p.key === 'fjr_office_start'
      return true
    })

    return filtered
  },
})

export const upsertMany = internalMutation({
  args: {
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
  handler: async ({ db }, { points }) => {
    const now = Date.now()
    for (const p of points) {
      const existing = await db.query('map_points').withIndex('by_key', (q) => q.eq('key', p.key)).unique()
      if (existing) {
        await db.patch(existing._id, { ...p, updatedAt: now })
      } else {
        await db.insert('map_points', { ...p, updatedAt: now })
      }
    }
  },
})

// Dev-only helper: публичный апсертер (для быстрой инициализации из клиента)
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
  handler: async ({ db }, { points, devToken }) => {
    const expected = (process as any).env?.VITE_DEV_SEED_TOKEN || (globalThis as any)?.VITE_DEV_SEED_TOKEN
    if (!expected || devToken !== expected) {
      throw new Error('Forbidden: invalid dev token')
    }
    const now = Date.now()
    for (const p of points) {
      const existing = await db.query('map_points').withIndex('by_key', (q) => q.eq('key', p.key)).unique()
      if (existing) {
        await db.patch(existing._id, { ...p, updatedAt: now })
      } else {
        await db.insert('map_points', { ...p, updatedAt: now })
      }
    }
  },
})


