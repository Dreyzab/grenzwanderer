import type { QueryCtx } from './_generated/server'

export async function loadQuestDependencies(db: QueryCtx['db']): Promise<Map<string, Set<string>>> {
  const deps = await db.query('quest_dependencies').collect()
  const map = new Map<string, Set<string>>()
  for (const d of deps as any[]) {
    const set = map.get(d.questId) ?? new Set<string>()
    set.add(d.requiresQuestId)
    map.set(d.questId, set)
  }
  return map
}

export function dependenciesSatisfied(questId: string, completed: Set<string>, deps: Map<string, Set<string>>): boolean {
  const reqs = deps.get(questId)
  if (!reqs || reqs.size === 0) return true
  for (const r of reqs) if (!completed.has(r)) return false
  return true
}

export function isQuestAllowedByPhase(phase: number, questId: string, metaById?: Map<string, any>): boolean {
  if (!metaById) return true
  const meta = metaById.get(questId)
  if (!meta) return true
  const gate = meta.phaseGate as number | undefined
  if (gate == null) return true
  return phase >= gate
}

export function filterQuestsByRequirements(
  metas: any[],
  player: { fame?: number; reputations?: Record<string, number> } | null,
  world: { phase?: number; flags?: string[] },
  completed: Set<string>,
): any[] {
  const phase = world?.phase ?? 0
  const fame = player?.fame ?? 0
  const flags = new Set<string>(world?.flags ?? [])
  return metas.filter((m: any) => {
    const req = (m.requirements ?? {}) as {
      fameMin?: number
      phaseMin?: number
      phaseMax?: number
      requiredFlags?: string[]
      forbiddenFlags?: string[]
    }
    if (req.phaseMin != null && phase < req.phaseMin) return false
    if (req.phaseMax != null && phase > req.phaseMax) return false
    if (req.fameMin != null && fame < req.fameMin) return false
    for (const f of req.requiredFlags ?? []) if (!flags.has(f)) return false
    for (const f of req.forbiddenFlags ?? []) if (flags.has(f)) return false
    if (completed.has(m.questId) && m.repeatable !== true) return false
    return true
  })
}

export async function computeAvailableQuests(
  db: QueryCtx['db'],
  sourceType: 'npc' | 'board',
  sourceKey: string,
  deviceId?: string,
  userId?: string,
): Promise<{ questId: string; type: string; priority: number }[]> {
  const registry = await db.query('quest_registry').collect()
  const metas = registry.filter((m: any) => (sourceType === 'npc' ? m.giverNpcId === sourceKey : m.boardKey === sourceKey))
  const identityProgress = userId
    ? await db.query('quest_progress').withIndex('by_user', (q) => q.eq('userId', userId)).collect()
    : deviceId
      ? await db.query('quest_progress').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).collect()
      : []
  const completed = new Set(identityProgress.filter((p: any) => p.completedAt).map((p: any) => p.questId))
  const player = userId
    ? await db.query('player_state').withIndex('by_user', (q) => q.eq('userId', userId)).unique()
    : deviceId
      ? await db.query('player_state').withIndex('by_device', (q) => q.eq('deviceId', deviceId)).unique()
      : null
  const world = await db.query('world_state').withIndex('by_key', (q) => q.eq('key', 'global')).unique()
  const filtered = filterQuestsByRequirements(metas, player as any, (world as any) ?? { phase: 0 }, completed)
  const deps = await loadQuestDependencies(db)
  return filtered
    .filter((m: any) => dependenciesSatisfied(m.questId, completed, deps))
    .map((m: any) => ({ questId: m.questId as string, type: m.type as string, priority: m.priority as number }))
    .sort((a, b) => b.priority - a.priority)
}

export function pickWinnerProgress(a: any, b: any): { winner: any; loser: any } {
  const score = (p: any) => (p.completedAt ? 1000000000 : 0) + (p.updatedAt ?? p.startedAt ?? 0)
  return score(a) >= score(b) ? { winner: a, loser: b } : { winner: b, loser: a }
}

export type {}


