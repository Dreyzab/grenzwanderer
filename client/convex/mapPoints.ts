import { internalMutation, mutation, query } from './_generated/server'
import type { QueryCtx, MutationCtx } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import { v, type Infer } from 'convex/values'

const pointInput = v.object({
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
})

type PointInput = Infer<typeof pointInput>

export const listAll = query(async ({ db }: QueryCtx) => {
  return db.query('map_points').withIndex('by_active', (q) => q.eq('active', true)).collect()
})

export const listVisible = query({
  args: { deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async (
    { db }: QueryCtx,
    { deviceId, userId }: { deviceId?: string; userId?: string },
  ) => {
    const points: Doc<'map_points'>[] = await db
      .query('map_points')
      .withIndex('by_active', (q) => q.eq('active', true))
      .collect()
    let progresses: Doc<'quest_progress'>[] = []
    let phase = 0
    let player: Doc<'player_state'> | null = null
    if (userId) {
      progresses = await db.query('quest_progress').withIndex('by_user', (q) => q.eq('userId', userId)).collect()
      player = await db.query('player_state').withIndex('by_user', (q) => q.eq('userId', userId)).unique()
    } else if (deviceId) {
      progresses = await db.query('quest_progress').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).collect()
      player = await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).unique()
    }
    phase = player?.phase ?? 0
    const playerFlags = new Set<string>(player?.flags ?? [])

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

    // Подсчёт завершённых вводных квестов фазы 1
    const phase1Ids = new Set<string>([
      'delivery_and_dilemma',
      'field_medicine',
      'combat_baptism',
      'quiet_cove_whisper',
      'bell_for_lost',
    ])
    const completedPhase1 = progresses.filter((pr: any) => pr.completedAt && phase1Ids.has(pr.questId)).length

    const filtered = points.filter((p) => {
      // ФАЗЫ: подсветка стартовых точек доступных квестов
      const phase1Starts = ['settlement_center', 'synthesis_medbay', 'quiet_cove_bar', 'cathedral']
      const phase2Starts = ['rathaus', 'seepark', 'wasserschlossle', 'fjr_office_start']
      if (phase === 1 && phase1Starts.includes(p.key)) return true
      if (phase === 2 && (phase2Starts.includes(p.key) || phase1Starts.includes(p.key))) return true

      // Не показывать точки завершённых квестов
      if (p.questId === 'delivery_and_dilemma' && deliveryStep === 'completed') return false
      if (p.questId === 'loyalty_fjr' && loyaltyStep === 'completed') return false
      if (p.questId === 'water_crisis' && waterStep === 'completed') return false
      if (p.questId === 'freedom_spark' && freedomStep === 'completed') return false

      // Разблокировка гражданства при выполнении N вводных квестов в фазе 1
      const N = 3
      const citizenshipStep = getStep('citizenship_invitation')
      if (phase === 1 && completedPhase1 >= N) {
        if (p.key === 'rathaus' && citizenshipStep === 'not_started') return true
      }
      if (loyaltyStep === 'go_to_hole') return p.key === 'anarchist_hole'

      if (waterStep === 'need_to_talk_to_gunter') return p.key === 'gunter_brewery'
      if (waterStep === 'talk_to_travers') return p.key === 'city_gate_travers'
      if (waterStep === 'got_proof' || waterStep === 'final_talk_with_gunter') return p.key === 'gunter_brewery'

      if (freedomStep === 'talk_to_odin') return p.key === 'anarchist_bar'
      if (freedomStep === 'find_rivet') return p.key === 'anarchist_arena_basement'
      if (freedomStep === 'friendship_final') return p.key === 'anarchist_bar'
      if (freedomStep === 'order_final') return p.key === 'carl_private_workshop'

      // Стартовый диалог квеста доставки показываем ТОЛЬКО если игрок явно отказался ранее
      if (deliveryStep === 'not_started') {
        if (p.dialogKey === 'quest_start_dialog' && playerFlags.has('decline_delivery_quest')) return true
        return false
      }
      if (deliveryStep === 'need_pickup_from_trader') return p.dialogKey === 'trader_meeting_dialog'
      if (deliveryStep === 'deliver_parts_to_craftsman' || deliveryStep === 'artifact_offer')
        return p.dialogKey === 'craftsman_meeting_dialog'
      if (deliveryStep === 'go_to_anomaly') return p.dialogKey === 'anomaly_exploration_dialog'
      if (deliveryStep === 'return_to_craftsman') return p.dialogKey === 'craftsman_meeting_dialog'
      // Точки фазы 2 (например, 'fjr_office_start') показываются только при мировой фазе 2 через phase2Starts
      return true
    })

    return filtered
  },
})

export const upsertMany = internalMutation({
  args: {
    points: v.array(pointInput),
  },
  handler: async ({ db }: MutationCtx, { points }: { points: PointInput[] }) => {
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
    points: v.array(pointInput),
  },
  handler: async (
    { db }: MutationCtx,
    { points, devToken }: { points: PointInput[]; devToken: string },
  ) => {
    const expected = (globalThis as any)?.process?.env?.VITE_DEV_SEED_TOKEN ?? (globalThis as any)?.VITE_DEV_SEED_TOKEN
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


