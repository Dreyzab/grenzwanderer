import { SenderError } from "spacetimedb/server";
import { createPlayerMindHypothesisKey } from "./entity_keys";
import { applyEffects } from "./effects";
import {
  parseFailureEffects,
  parseUnlockFactIds,
  parseVerdict,
} from "./payload_json";
import { ensurePlayerProfile } from "./player_profile";
import { emitTelemetry } from "./telemetry";
import {
  ensureMindCaseActive,
  ensureMindHypothesisForCase,
} from "./mind_guards";
import { ensurePlayerMindCaseRow } from "./mind_discover";
import {
  getDiscoveredFactIds,
  getHypothesisReadinessForFacts,
  maybeCompleteMindCase,
} from "./mind_hypothesis";
import { getLinkedFactIdsForHypothesis } from "./mind_links";

export const ASSERT_COOLDOWN_MICROS = 120_000_000n;

export type AssertHypothesisOutcome = "validated" | "refuted" | "failed";

export const isHypothesisUnlocked = (
  ctx: any,
  caseId: string,
  hypothesisRow: any,
): boolean => {
  const unlockFactIds = parseUnlockFactIds(hypothesisRow.unlockFactIdsJson);
  if (unlockFactIds.length === 0) {
    return true;
  }

  const discovered = getDiscoveredFactIds(ctx, caseId);
  return unlockFactIds.some((factId) => discovered.has(factId));
};

export const assertHypothesisInternal = (
  ctx: any,
  caseId: string,
  hypothesisId: string,
): { outcome: AssertHypothesisOutcome; caseCompleted: boolean } => {
  ensurePlayerProfile(ctx);
  ensureMindCaseActive(ctx, caseId);
  const hypothesis = ensureMindHypothesisForCase(ctx, caseId, hypothesisId);
  ensurePlayerMindCaseRow(ctx, caseId);

  if (!isHypothesisUnlocked(ctx, caseId, hypothesis)) {
    throw new SenderError("Hypothesis is still locked");
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
  if (existing?.status === "refuted") {
    throw new SenderError("Hypothesis already refuted");
  }

  if (existing?.lastAssertAt) {
    const nowMicros = ctx.timestamp.microsSinceUnixEpoch as bigint;
    const lastAssertMicros = existing.lastAssertAt
      .microsSinceUnixEpoch as bigint;
    const elapsed = nowMicros - lastAssertMicros;
    if (elapsed < ASSERT_COOLDOWN_MICROS) {
      const remainingSeconds = Number(
        (ASSERT_COOLDOWN_MICROS - elapsed + 999_999n) / 1_000_000n,
      );
      throw new SenderError(
        `Assertion cooldown active: retry in ${remainingSeconds}s`,
      );
    }
  }

  const linkedFactIds = getLinkedFactIdsForHypothesis(
    ctx,
    caseId,
    hypothesisId,
  );
  const readiness = getHypothesisReadinessForFacts(
    ctx,
    hypothesis,
    linkedFactIds,
  );
  const verdict = parseVerdict(hypothesis.verdict);
  const failureEffects = parseFailureEffects(hypothesis.failureEffectsJson);
  const failedAttempts = existing?.failedAttempts ?? 0;

  const upsertPlayerHypothesis = (nextRow: Record<string, unknown>): void => {
    if (existing) {
      ctx.db.playerMindHypothesis.playerHypothesisKey.update({
        ...existing,
        ...nextRow,
      });
    } else {
      ctx.db.playerMindHypothesis.insert(nextRow);
    }
  };

  if (!readiness.ready) {
    upsertPlayerHypothesis({
      playerHypothesisKey,
      playerId: ctx.sender,
      caseId,
      hypothesisId,
      status: "pending",
      validatedAt: undefined,
      lastAssertAt: ctx.timestamp,
      failedAttempts: failedAttempts + 1,
      updatedAt: ctx.timestamp,
    });

    applyEffects(ctx, failureEffects);

    emitTelemetry(
      ctx,
      "mind_hypothesis_assert_failed",
      {
        caseId,
        hypothesisId,
        missingCount:
          readiness.missingFacts.length + readiness.failedVarConditions.length,
        attempt: failedAttempts + 1,
      },
      readiness.missingFacts.length,
    );

    return { outcome: "failed", caseCompleted: false };
  }

  if (verdict === "decoy") {
    upsertPlayerHypothesis({
      playerHypothesisKey,
      playerId: ctx.sender,
      caseId,
      hypothesisId,
      status: "refuted",
      validatedAt: undefined,
      lastAssertAt: ctx.timestamp,
      failedAttempts,
      updatedAt: ctx.timestamp,
    });

    applyEffects(ctx, failureEffects);

    emitTelemetry(ctx, "mind_hypothesis_refuted", {
      caseId,
      hypothesisId,
    });

    return { outcome: "refuted", caseCompleted: false };
  }

  upsertPlayerHypothesis({
    playerHypothesisKey,
    playerId: ctx.sender,
    caseId,
    hypothesisId,
    status: "validated",
    validatedAt: ctx.timestamp,
    lastAssertAt: ctx.timestamp,
    failedAttempts,
    updatedAt: ctx.timestamp,
  });

  applyEffects(ctx, readiness.rewardEffects);

  emitTelemetry(ctx, "mind_hypothesis_validated", {
    caseId,
    hypothesisId,
  });

  return {
    outcome: "validated",
    caseCompleted: maybeCompleteMindCase(ctx, caseId),
  };
};
