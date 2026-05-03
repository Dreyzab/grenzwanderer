import { SenderError } from "spacetimedb/server";
import {
  createPlayerMindCaseKey,
  createPlayerMindHypothesisKey,
} from "./entity_keys";
import { applyEffects } from "./effects";
import {
  parseRequiredFactIds,
  parseRequiredVars,
  parseRewardEffects,
} from "./payload_json";
import { getVar } from "./player_progression";
import { ensurePlayerProfile } from "./player_profile";
import { emitTelemetry } from "./telemetry";
import type { HypothesisReadiness, MindRequiredVar } from "./types";
import {
  ensureMindCaseActive,
  ensureMindHypothesisForCase,
} from "./mind_guards";
import { ensurePlayerMindCaseRow } from "./mind_discover";

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

export const getHypothesisReadiness = (
  ctx: any,
  caseId: string,
  hypothesisRow: any,
): HypothesisReadiness => {
  const requiredFacts = parseRequiredFactIds(hypothesisRow.requiredFactIdsJson);
  const requiredVars = parseRequiredVars(hypothesisRow.requiredVarsJson);
  const rewardEffects = parseRewardEffects(hypothesisRow.rewardEffectsJson);

  const discoveredFacts = new Set<string>();
  for (const row of ctx.db.playerMindFact.iter()) {
    if (row.playerId.toHexString() !== ctx.sender.toHexString()) {
      continue;
    }
    if (row.caseId !== caseId) {
      continue;
    }
    discoveredFacts.add(row.factId);
  }

  const missingFacts = requiredFacts.filter(
    (requiredFactId) => !discoveredFacts.has(requiredFactId),
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

const maybeCompleteMindCase = (ctx: any, caseId: string): boolean => {
  const hypothesisRows = [...ctx.db.mindHypothesis.iter()].filter(
    (row) => row.caseId === caseId,
  );
  if (hypothesisRows.length === 0) {
    return false;
  }

  const validated = new Set<string>();
  for (const row of ctx.db.playerMindHypothesis.iter()) {
    if (row.playerId.toHexString() !== ctx.sender.toHexString()) {
      continue;
    }
    if (row.caseId !== caseId) {
      continue;
    }
    if (row.status === "validated") {
      validated.add(row.hypothesisId);
    }
  }

  const allValidated = hypothesisRows.every((row) =>
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

  emitTelemetry(ctx, "mind_case_completed", {
    caseId,
  });

  return true;
};

export const validateHypothesisInternal = (
  ctx: any,
  caseId: string,
  hypothesisId: string,
): { caseCompleted: boolean } => {
  ensurePlayerProfile(ctx);
  ensureMindCaseActive(ctx, caseId);
  const hypothesis = ensureMindHypothesisForCase(ctx, caseId, hypothesisId);
  ensurePlayerMindCaseRow(ctx, caseId);

  const readiness = getHypothesisReadiness(ctx, caseId, hypothesis);
  if (!readiness.ready) {
    throw new SenderError("Hypothesis requirements are not satisfied");
  }

  const playerHypothesisKey = createPlayerMindHypothesisKey(
    ctx.sender,
    caseId,
    hypothesisId,
  );
  const existing =
    ctx.db.playerMindHypothesis.playerHypothesisKey.find(playerHypothesisKey);
  if (existing?.status === "validated") {
    throw new SenderError("Hypothesis already validated");
  }

  const nextRow = {
    playerHypothesisKey,
    playerId: ctx.sender,
    caseId,
    hypothesisId,
    status: "validated",
    validatedAt: ctx.timestamp,
    updatedAt: ctx.timestamp,
  };

  if (existing) {
    ctx.db.playerMindHypothesis.playerHypothesisKey.update({
      ...existing,
      ...nextRow,
    });
  } else {
    ctx.db.playerMindHypothesis.insert(nextRow);
  }

  applyEffects(ctx, readiness.rewardEffects);

  emitTelemetry(ctx, "mind_hypothesis_validated", {
    caseId,
    hypothesisId,
  });

  return {
    caseCompleted: maybeCompleteMindCase(ctx, caseId),
  };
};
