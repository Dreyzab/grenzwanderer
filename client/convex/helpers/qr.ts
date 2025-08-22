import type { GenericQueryCtx } from "convex/server";
import { loadQuestDependencies, dependenciesSatisfied, filterQuestsByRequirements } from "./quest";

export async function choosePointBinding(
  ctx: GenericQueryCtx<any>,
  pointKey: string,
  player: any,
  world: any,
  done: Set<string>,
) {
  const deps = await loadQuestDependencies((ctx as any).db);
  const bindings = await (ctx as any).db
    .query('mappoint_bindings')
    .withIndex('by_point', (q: any) => q.eq('pointKey', pointKey))
    .collect();
  const metas = await (ctx as any).db.query('quest_registry').collect();
  const metaById = new Map<string, any>(metas.map((m: any) => [m.questId, m]));
  const phaseContext = (world as any) ?? { phase: player?.phase ?? 0 };
  const allowed = filterQuestsByRequirements(
    bindings
      .map((b: any) => metaById.get(b.questId))
      .filter((m: any) => Boolean(m)),
    player ?? null,
    phaseContext as any,
    done,
  );
  const allowedIds = new Set(allowed.map((m: any) => m.questId));
  const candidates = bindings
    .filter((b: any) => allowedIds.has(b.questId))
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  const chosen = candidates.find((m: any) => dependenciesSatisfied(m.questId, done, deps));
  return { chosen, bindings, metas };
}


