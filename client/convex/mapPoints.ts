import { internalMutation, mutation, query } from './_generated/server'
import type { QueryCtx, MutationCtx } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import { v, type Infer } from 'convex/values'
import { filterQuestsByRequirements, loadQuestDependencies, dependenciesSatisfied } from './quests.helpers.ts'

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
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    bbox: v.optional(
      v.object({ minLat: v.number(), minLng: v.number(), maxLat: v.number(), maxLng: v.number() }),
    ),
  },
  handler: async (
    { db, auth }: QueryCtx,
    {
      deviceId,
      userId,
      bbox,
    }: { deviceId?: string; userId?: string; bbox?: { minLat: number; minLng: number; maxLat: number; maxLng: number } },
  ) => {
    const identity = await auth.getUserIdentity()
    const resolvedUserId = userId ?? identity?.subject ?? undefined
    let points: Doc<'map_points'>[] = await db
      .query('map_points')
      .withIndex('by_active', (q) => q.eq('active', true))
      .collect()
    if (bbox) {
      points = points.filter((p) => {
        const { lat, lng } = p.coordinates as any
        return lat >= bbox.minLat && lat <= bbox.maxLat && lng >= bbox.minLng && lng <= bbox.maxLng
      })
    }
    let progresses: Doc<'quest_progress'>[] = []
    let phase = 0
    let player: Doc<'player_state'> | null = null
    let world: Doc<'world_state'> | null = null
    if (resolvedUserId) {
      progresses = await db.query('quest_progress').withIndex('by_user', (q) => q.eq('userId', resolvedUserId)).collect()
      player = await db.query('player_state').withIndex('by_user', (q) => q.eq('userId', resolvedUserId)).unique()
    } else if (deviceId) {
      progresses = await db.query('quest_progress').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).collect()
      player = await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).unique()
    }
    world = await db.query('world_state').withIndex('by_key', (q) => q.eq('key', 'global')).unique()
    phase = player?.phase ?? 0
    const done = new Set(progresses.filter((p: any) => p.completedAt).map((p: any) => p.questId))

    // Загрузим биндинги точек и метаданные квестов
    const bindings = await db.query('mappoint_bindings').collect()
    const byPoint = new Map<string, Array<Doc<'mappoint_bindings'>>>()
    for (const b of bindings) {
      if (!byPoint.has(b.pointKey)) byPoint.set(b.pointKey, [])
      byPoint.get(b.pointKey)!.push(b)
    }
    const questMetas = await db.query('quest_registry').collect()
    const metaById = new Map<string, any>(questMetas.map((m: any) => [m.questId as string, m]))
    const deps = await loadQuestDependencies(db)

    const filtered = points.filter((p) => {
      // ФАЗЫ: после вступления (фаза 1) показываем стартовые точки квестов Фазы 1 (включая доску)
      const phase1Starts = ['settlement_center', 'synthesis_medbay', 'quiet_cove_bar', 'old_believers_square', 'fjr_office_start', 'fjr_board']
      const phase2Starts = ['rathaus', 'seepark', 'wasserschlossle', 'fjr_office_start']
      if (phase === 1 && phase1Starts.includes(p.key)) return true
      if (phase === 2 && (phase2Starts.includes(p.key) || phase1Starts.includes(p.key))) return true
      // Для остальных точек: используем биндинги и метаданные
      const bList = byPoint.get(p.key) ?? []
      if (bList.length === 0) return false
      // Фильтр по фазовому окну биндинга
      const bForPhase = bList.filter((b) => {
        const fromOk = b.phaseFrom == null || phase >= b.phaseFrom
        const toOk = b.phaseTo == null || phase <= b.phaseTo
        return fromOk && toOk
      })
      if (bForPhase.length === 0) return false
      // Получаем метаданные квестов и фильтруем по требованиям
      const metas: any[] = bForPhase
        .map((bind) => metaById.get(bind.questId))
        .filter((meta): meta is any => Boolean(meta))
      const allowed = filterQuestsByRequirements(metas, player as any, (world as any) ?? { phase }, done)
      if (allowed.length === 0) return false
      // Фильтр по зависимостям
      const allowedByDeps = allowed.filter((meta: any) => dependenciesSatisfied(meta.questId, done, deps))
      return allowedByDeps.length > 0
    })

    // Обогащаем выдачу dialogKey/startKey из биндингов (если заданы)
    const enriched = filtered.map((p) => {
      const bList = byPoint.get(p.key) ?? []
      const bForPhase = bList.filter((b) => {
        const fromOk = b.phaseFrom == null || phase >= b.phaseFrom
        const toOk = b.phaseTo == null || phase <= b.phaseTo
        return fromOk && toOk
      })
      // Выбираем первый по order биндинг, удовлетворяющий требованиям/зависимостям
      const metas: any[] = bForPhase.map((bind) => metaById.get(bind.questId)).filter((meta): meta is any => Boolean(meta))
      const allowed = filterQuestsByRequirements(metas, player as any, (world as any) ?? { phase }, done)
      const allowedIds = new Set(allowed.map((meta: any) => meta.questId))
      const candidates = bForPhase.filter((bind) => allowedIds.has(bind.questId)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      const chosen = candidates.find((bind) => dependenciesSatisfied(bind.questId, done, deps))
      if (!chosen) return p
      return {
        ...p,
        dialogKey: chosen.dialogKey ?? p.dialogKey,
        questId: p.questId ?? chosen.questId,
        // Кладём startKey как eventKey для клиентской обработки
        eventKey: (chosen as any).startKey,
        npcId: (chosen as any).npcId,
      }
    })

    return enriched
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


