import type { GenericQueryCtx } from "convex/server";
import { requirementsSatisfied } from "./quest";

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
  ctx: GenericQueryCtx<any>,
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

export async function diagnoseStartBindings(
  ctx: GenericQueryCtx<any>,
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


