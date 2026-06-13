import { createPlayerMindCaseKey } from "./entity_keys";
import {
  parseRequiredFactIds,
  parseRequiredVars,
  parseRewardEffects,
  parseVerdict,
} from "./payload_json";
import { getVar } from "./player_progression";
import { emitTelemetry } from "./telemetry";
import type { HypothesisReadiness, MindRequiredVar } from "./types";

const doesVarConditionPass = (
  ctx: any,
  requiredVar: MindRequiredVar,
): boolean => {
  const current = getVar(ctx, requiredVar.key);

  if (requiredVar.op === "gte") {
    return current >= requiredVar.value;
  }
  if (requiredVar.op === "lte") {
    return current <= requiredVar.value;
  }

  return current === requiredVar.value;
};

export const getHypothesisReadinessForFacts = (
  ctx: any,
  hypothesisRow: any,
  factIds: Set<string>,
): HypothesisReadiness => {
  const requiredFacts = parseRequiredFactIds(hypothesisRow.requiredFactIdsJson);
  const requiredVars = parseRequiredVars(hypothesisRow.requiredVarsJson);
  const rewardEffects = parseRewardEffects(hypothesisRow.rewardEffectsJson);

  const missingFacts = requiredFacts.filter(
    (requiredFactId) => !factIds.has(requiredFactId),
  );
  const failedVarConditions = requiredVars.filter(
    (requiredVar) => !doesVarConditionPass(ctx, requiredVar),
  );

  return {
    requiredFacts,
    requiredVars,
    rewardEffects,
    missingFacts,
    failedVarConditions,
    ready: missingFacts.length === 0 && failedVarConditions.length === 0,
  };
};

export const getDiscoveredFactIds = (ctx: any, caseId: string): Set<string> => {
  const discoveredFacts = new Set<string>();
  for (const row of ctx.db.playerMindFact.player_mind_fact_player_id.filter(
    ctx.sender,
  )) {
    if (row.caseId !== caseId) {
      continue;
    }
    discoveredFacts.add(row.factId);
  }

  return discoveredFacts;
};

export const getHypothesisReadiness = (
  ctx: any,
  caseId: string,
  hypothesisRow: any,
): HypothesisReadiness =>
  getHypothesisReadinessForFacts(
    ctx,
    hypothesisRow,
    getDiscoveredFactIds(ctx, caseId),
  );

export const maybeCompleteMindCase = (ctx: any, caseId: string): boolean => {
  const hypothesisRows = [
    ...ctx.db.mindHypothesis.mind_hypothesis_case_id.filter(caseId),
  ];
  const requiredRows = hypothesisRows.filter(
    (row) => parseVerdict(row.verdict) === "true",
  );
  if (requiredRows.length === 0) {
    return false;
  }

  const validated = new Set<string>();
  for (const row of ctx.db.playerMindHypothesis.player_mind_hypothesis_player_id.filter(
    ctx.sender,
  )) {
    if (row.caseId !== caseId) {
      continue;
    }
    if (row.status === "validated") {
      validated.add(row.hypothesisId);
    }
  }

  const allValidated = requiredRows.every((row) =>
    validated.has(row.hypothesisId),
  );
  if (!allValidated) {
    return false;
  }

  const playerCaseKey = createPlayerMindCaseKey(ctx.sender, caseId);
  const caseRow = ctx.db.playerMindCase.playerCaseKey.find(playerCaseKey);
  if (!caseRow) {
    return false;
  }

  if (caseRow.status === "completed") {
    return false;
  }

  ctx.db.playerMindCase.playerCaseKey.update({
    ...caseRow,
    status: "completed",
    completedAt: ctx.timestamp,
    updatedAt: ctx.timestamp,
  });

  const completedMicros = ctx.timestamp.microsSinceUnixEpoch as bigint;
  const startedMicros = caseRow.startedAt.microsSinceUnixEpoch as bigint;
  const solveSeconds = Number((completedMicros - startedMicros) / 1_000_000n);
  emitTelemetry(ctx, "mind_case_completed", { caseId }, solveSeconds);

  return true;
};
