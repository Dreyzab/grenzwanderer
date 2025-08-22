import type { Doc } from "../_generated/dataModel";

export interface QuestRequirements {
  fameMin?: number;
  phaseMin?: number;
  phaseMax?: number;
  requiredFlags?: string[];
  forbiddenFlags?: string[];
  reputations?: Record<string, number>;
  relationships?: Record<string, number>;
}

export function requirementsSatisfied(
  req: QuestRequirements | undefined,
  player: Partial<Doc<"player_state">> | null,
): boolean {
  if (!req) return true;
  const phase = (player as any)?.phase ?? 0;
  const fame = (player as any)?.fame ?? 0;
  if (typeof req.phaseMin === "number" && phase < req.phaseMin) return false;
  if (typeof req.phaseMax === "number" && phase > req.phaseMax) return false;
  if (typeof req.fameMin === "number" && fame < req.fameMin) return false;
  if (Array.isArray(req.requiredFlags)) {
    const flags = new Set((player as any)?.flags ?? []);
    for (const f of req.requiredFlags) if (!flags.has(f)) return false;
  }
  if (Array.isArray(req.forbiddenFlags)) {
    const flags = new Set((player as any)?.flags ?? []);
    for (const f of req.forbiddenFlags) if (flags.has(f)) return false;
  }
  if (req.reputations) {
    const rep: Record<string, number> = ((player as any)?.reputations ?? {}) as Record<string, number>;
    for (const k of Object.keys(req.reputations)) {
      if ((rep?.[k] ?? 0) < (req.reputations[k] ?? 0)) return false;
    }
  }
  if (req.relationships) {
    const rel: Record<string, number> = ((player as any)?.relationships ?? {}) as Record<string, number>;
    for (const k of Object.keys(req.relationships)) {
      if ((rel?.[k] ?? 0) < (req.relationships[k] ?? 0)) return false;
    }
  }
  return true;
}

export async function loadQuestDependencies(
  db: any,
): Promise<Map<string, string[]>> {
  const deps = await db.query("quest_dependencies").collect();
  const map = new Map<string, string[]>();
  for (const d of deps) {
    const arr = map.get(d.questId) ?? [];
    arr.push(d.requiresQuestId);
    map.set(d.questId, arr);
  }
  return map;
}

export function dependenciesSatisfied(
  questId: string,
  done: Set<string>,
  deps: Map<string, string[]>,
): boolean {
  const reqs = deps.get(questId) ?? [];
  for (const r of reqs) if (!done.has(r)) return false;
  return true;
}

export function filterQuestsByRequirements(
  metas: any[],
  player: Partial<Doc<"player_state">> | null,
  phaseContext: { phase?: number } | null,
  done: Set<string>,
  deps?: Map<string, string[]>,
) {
  const phase = (phaseContext?.phase ?? (player as any)?.phase ?? 0) as number;
  return metas.filter((m) => {
    if (typeof m.phaseGate === "number" && phase < m.phaseGate) return false;
    if (!requirementsSatisfied(m.requirements, player)) return false;
    if (deps && !dependenciesSatisfied(m.questId, done, deps)) return false;
    return true;
  });
}


