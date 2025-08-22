import type { GenericQueryCtx } from "convex/server";

// Local copy: требования к квесту (фаза, репутации, флаги и т.п.)
export function requirementsSatisfied(requirements: any | undefined, player: any): boolean {
	if (!requirements) return true;
	const phase = player?.phase ?? 0;
	if (typeof requirements.phaseMin === "number" && phase < requirements.phaseMin) return false;
	if (typeof requirements.phaseMax === "number" && phase > requirements.phaseMax) return false;
	if (typeof requirements.fameMin === "number" && (player?.fame ?? 0) < requirements.fameMin) return false;
	if (Array.isArray(requirements.requiredFlags)) {
		const flags = new Set<string>(player?.flags ?? []);
		for (const f of requirements.requiredFlags) if (!flags.has(f)) return false;
	}
	if (Array.isArray(requirements.forbiddenFlags)) {
		const flags = new Set<string>(player?.flags ?? []);
		for (const f of requirements.forbiddenFlags) if (flags.has(f)) return false;
	}
	if (requirements.reputations) {
		for (const k of Object.keys(requirements.reputations)) {
			const need = (requirements.reputations as any)[k];
			const has = (player?.reputations ?? {})[k] ?? 0;
			if (has < need) return false;
		}
	}
	if (requirements.relationships) {
		for (const k of Object.keys(requirements.relationships)) {
			const need = (requirements.relationships as any)[k];
			const has = (player?.relationships ?? {})[k] ?? 0;
			if (has < need) return false;
		}
	}
	return true;
}

export async function computeAllowedQuestMetaIds(
  ctx: GenericQueryCtx<any>,
  player: any,
) {
  const phase = player?.phase ?? 0;
  const metas = await (ctx as any).db.query("quest_registry").collect();
  const allowed = new Set<string>();
  for (const m of metas) {
    if (!requirementsSatisfied(m.requirements, player)) continue;
    if (typeof m.phaseGate === "number" && phase < m.phaseGate) continue;
    allowed.add(m.questId);
  }
  return { metas, allowed };
}

export async function selectStartBindings(
  _ctx: GenericQueryCtx<any>,
  bindings: any[],
  allowedMetaIds: Set<string>,
  phase: number,
  active: Set<string>,
  completed: Set<string>,
  depsSatisfied: (questId: string) => Promise<boolean>,
) {
  const startBindings: any[] = [];
  for (const b of bindings) {
    if (!b.startKey) continue;
    if (!allowedMetaIds.has(b.questId)) continue;
    if (typeof b.phaseFrom === "number" && phase < b.phaseFrom) continue;
    if (typeof b.phaseTo === "number" && phase > b.phaseTo) continue;
    if (active.has(b.questId) || completed.has(b.questId)) continue;
    if (!(await depsSatisfied(b.questId))) continue;
    startBindings.push(b);
  }
  return startBindings;
}

export async function selectProgressBindings(
  _ctx: GenericQueryCtx<any>,
  bindings: any[],
  phase: number,
  active: Set<string>,
  currentSteps?: Map<string, string>,
) {
  const progress: any[] = []
  for (const b of bindings) {
    if (!active.has(b.questId)) continue
    if (typeof b.phaseFrom === 'number' && phase < b.phaseFrom) continue
    if (typeof b.phaseTo === 'number' && phase > b.phaseTo) continue
    // Фильтрация по текущему шагу (если задан stepKey)
    const requiredStep = (b as any).stepKey as string | undefined
    if (requiredStep && currentSteps) {
      const step = currentSteps.get(b.questId)
      if (step !== requiredStep) continue
    }
    progress.push(b)
  }
  return progress
}

export async function diagnoseStartBindings(
  _ctx: GenericQueryCtx<any>,
  bindings: any[],
  allowedMetaIds: Set<string>,
  phase: number,
  active: Set<string>,
  completed: Set<string>,
  depsSatisfied: (questId: string) => Promise<boolean>,
) {
  const startBindings: any[] = [];
  const excluded: Array<{ pointKey: string; questId: string; reason: string }> = [];
  for (const b of bindings) {
    if (!b.startKey) { excluded.push({ pointKey: b.pointKey, questId: b.questId, reason: 'no_startKey' }); continue }
    if (!allowedMetaIds.has(b.questId)) { excluded.push({ pointKey: b.pointKey, questId: b.questId, reason: 'meta_not_allowed' }); continue }
    if (typeof b.phaseFrom === 'number' && phase < b.phaseFrom) { excluded.push({ pointKey: b.pointKey, questId: b.questId, reason: 'phaseFrom' }); continue }
    if (typeof b.phaseTo === 'number' && phase > b.phaseTo) { excluded.push({ pointKey: b.pointKey, questId: b.questId, reason: 'phaseTo' }); continue }
    if (active.has(b.questId) || completed.has(b.questId)) { excluded.push({ pointKey: b.pointKey, questId: b.questId, reason: 'already_started_or_completed' }); continue }
    const ok = await depsSatisfied(b.questId)
    if (!ok) { excluded.push({ pointKey: b.pointKey, questId: b.questId, reason: 'deps' }); continue }
    startBindings.push(b)
  }
  return { startBindings, excluded };
}


