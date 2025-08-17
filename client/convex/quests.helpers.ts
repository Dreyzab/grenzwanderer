// Extracted helpers for quests endpoints

export interface QuestRequirementsMeta {
  fameMin?: number
  phaseMin?: number
  phaseMax?: number
  requiredFlags?: string[]
  forbiddenFlags?: string[]
  reputations?: Record<string, number>
  relationships?: Record<string, number>
}

export interface QuestMeta {
  questId: string
  type: 'story' | 'faction' | 'personal' | 'procedural'
  giverNpcId?: string
  boardKey?: string
  repeatable?: boolean
  priority: number
  phaseGate?: number
  requirements?: QuestRequirementsMeta
}

export interface PlayerStateRow {
  phase: number
  fame?: number
  status?: string
  flags?: string[]
  reputations?: Record<string, number>
  relationships?: Record<string, number>
}

export interface WorldStateRow {
  phase: number
  flags?: string[]
}

export const PHASE1_ALLOWED = new Set<string>([
  'delivery_and_dilemma',
  'field_medicine',
  'combat_baptism',
  'quiet_cove_whisper',
  'bell_for_lost',
])

export const PHASE2_ALLOWED = new Set<string>([
  'citizenship_invitation',
  'eyes_in_the_dark',
  'void_shards',
  'water_crisis',
  'loyalty_fjr',
  'freedom_spark',
])

export function isQuestAllowedByPhase(phase: number, questId: string): boolean {
  if (phase >= 2) return PHASE1_ALLOWED.has(questId) || PHASE2_ALLOWED.has(questId)
  return PHASE1_ALLOWED.has(questId)
}

export function questTypeRank(type: QuestMeta['type']): number {
  switch (type) {
    case 'story':
      return 3
    case 'personal':
      return 2
    case 'faction':
      return 1
    case 'procedural':
      return 0
    default:
      return 0
  }
}

export function pickWinnerProgress(a: any, b: any) {
  const completeAdv = (x: any) => Boolean(x?.completedAt)
  if (completeAdv(a) && !completeAdv(b)) return { winner: a, loser: b }
  if (completeAdv(b) && !completeAdv(a)) return { winner: b, loser: a }
  const aTime = a?.updatedAt ?? 0
  const bTime = b?.updatedAt ?? 0
  return aTime >= bTime ? { winner: a, loser: b } : { winner: b, loser: a }
}

export function filterQuestsByRequirements(
  quests: QuestMeta[],
  player: PlayerStateRow | null,
  world: WorldStateRow | null,
  completedQuestIds: Set<string>,
): QuestMeta[] {
  return quests.filter((qmeta) => {
    if (!player || !world) return false
    if (qmeta.phaseGate != null && world.phase < qmeta.phaseGate) return false
    if (!qmeta.repeatable && completedQuestIds.has(qmeta.questId)) return false
    const req = qmeta.requirements ?? {}
    if (req.phaseMin != null && player.phase < req.phaseMin) return false
    if (req.phaseMax != null && player.phase > req.phaseMax) return false
    if (req.fameMin != null && (player.fame ?? 0) < req.fameMin) return false
    if (req.requiredFlags && req.requiredFlags.length > 0) {
      const have = new Set(player.flags ?? [])
      for (const fl of req.requiredFlags) if (!have.has(fl)) return false
    }
    if (req.forbiddenFlags && req.forbiddenFlags.length > 0) {
      const have = new Set(player.flags ?? [])
      for (const fl of req.forbiddenFlags) if (have.has(fl)) return false
    }
    if (req.reputations) {
      for (const k of Object.keys(req.reputations)) {
        const min = req.reputations[k] ?? 0
        if (((player.reputations ?? {})[k] ?? 0) < min) return false
      }
    }
    if (req.relationships) {
      for (const k of Object.keys(req.relationships)) {
        const min = req.relationships[k] ?? 0
        if (((player.relationships ?? {})[k] ?? 0) < min) return false
      }
    }
    return true
  })
}

// Загрузка зависимостей квестов и проверка удовлетворённости
export async function loadQuestDependencies(db: any): Promise<Map<string, Set<string>>> {
  const deps = await db.query('quest_dependencies').collect()
  const map = new Map<string, Set<string>>()
  for (const d of deps) {
    if (!map.has(d.questId)) map.set(d.questId, new Set<string>())
    map.get(d.questId)!.add(d.requiresQuestId)
  }
  return map as Map<string, Set<string>>
}

export function dependenciesSatisfied(
  questId: string,
  completedQuestIds: Set<string>,
  depsMap: Map<string, Set<string>>,
): boolean {
  const req = depsMap.get(questId)
  if (!req || req.size === 0) return true
  for (const r of req) if (!completedQuestIds.has(r)) return false
  return true
}

export async function loadPlayerWorldProgress(db: any, deviceId?: string, userId?: string) {
  const player = userId
    ? await db.query('player_state').withIndex('by_user', (q: any) => q.eq('userId', userId)).unique()
    : deviceId
    ? await db.query('player_state').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).unique()
    : null
  const world = await db.query('world_state').withIndex('by_key', (q: any) => q.eq('key', 'global')).unique()
  const progress = userId
    ? await db.query('quest_progress').withIndex('by_user', (q: any) => q.eq('userId', userId)).collect()
    : deviceId
    ? await db.query('quest_progress').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).collect()
    : []
  const done = new Set(progress.filter((p: any) => p.completedAt).map((p: any) => p.questId))
  return { player, world, done }
}

export async function listFromSource(db: any, sourceType: 'npc' | 'board', sourceKey: string): Promise<QuestMeta[]> {
  if (sourceType === 'npc') {
    return (await db.query('quest_registry').withIndex('by_giver', (q: any) => q.eq('giverNpcId', sourceKey)).collect()) as QuestMeta[]
  }
  return (await db.query('quest_registry').withIndex('by_board', (q: any) => q.eq('boardKey', sourceKey)).collect()) as QuestMeta[]
}

export async function computeAvailableQuests(
  db: any,
  sourceType: 'npc' | 'board',
  sourceKey: string,
  deviceId?: string,
  userId?: string,
) {
  const { player, world, done } = (await loadPlayerWorldProgress(db, deviceId, userId)) as unknown as {
    player: PlayerStateRow | null
    world: WorldStateRow | null
    done: Set<string>
  }
  const all = await listFromSource(db, sourceType, sourceKey)
  return filterQuestsByRequirements(all, player, world, done).sort((a, b) => {
    const byType = questTypeRank(b.type) - questTypeRank(a.type)
    if (byType !== 0) return byType
    return b.priority - a.priority
  })
}


