import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  createHypothesisFocusFlagKey,
  createPlayerMindCaseKey,
  discoverFactInternal,
  emitTelemetry,
  ensureIdempotent,
  ensureMindCaseActive,
  ensureMindHypothesisForCase,
  ensurePlayerProfile,
  upsertFlag,
  validateHypothesisInternal,
} from "./helpers";

export const start_mind_case = spacetimedb.reducer(
  {
    requestId: t.string(),
    caseId: t.string(),
  },
  (ctx, { requestId, caseId }) => {
    if (!caseId || caseId.trim().length === 0) {
      throw new SenderError("caseId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "start_mind_case");
    ensurePlayerProfile(ctx);
    ensureMindCaseActive(ctx, caseId);

    const playerCaseKey = createPlayerMindCaseKey(ctx.sender, caseId);
    const existing = ctx.db.playerMindCase.playerCaseKey.find(playerCaseKey);

    if (existing) {
      ctx.db.playerMindCase.playerCaseKey.update({
        ...existing,
        status: "in_progress",
        completedAt: undefined,
        startedAt: ctx.timestamp,
        updatedAt: ctx.timestamp,
      });
    } else {
      ctx.db.playerMindCase.insert({
        playerCaseKey,
        playerId: ctx.sender,
        caseId,
        status: "in_progress",
        startedAt: ctx.timestamp,
        completedAt: undefined,
        updatedAt: ctx.timestamp,
      });
    }

    emitTelemetry(ctx, "mind_case_started", {
      caseId,
    });
  },
);

export const discover_fact = spacetimedb.reducer(
  {
    requestId: t.string(),
    caseId: t.string(),
    factId: t.string(),
  },
  (ctx, { requestId, caseId, factId }) => {
    if (!caseId || caseId.trim().length === 0) {
      throw new SenderError("caseId must not be empty");
    }
    if (!factId || factId.trim().length === 0) {
      throw new SenderError("factId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "discover_fact");
    discoverFactInternal(ctx, caseId, factId, {
      sourceType: "reducer",
      sourceId: "discover_fact",
    });
  },
);

export const validate_hypothesis = spacetimedb.reducer(
  {
    requestId: t.string(),
    caseId: t.string(),
    hypothesisId: t.string(),
  },
  (ctx, { requestId, caseId, hypothesisId }) => {
    if (!caseId || caseId.trim().length === 0) {
      throw new SenderError("caseId must not be empty");
    }
    if (!hypothesisId || hypothesisId.trim().length === 0) {
      throw new SenderError("hypothesisId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "validate_hypothesis");
    validateHypothesisInternal(ctx, caseId, hypothesisId);
  },
);

export const set_hypothesis_focus = spacetimedb.reducer(
  {
    caseId: t.string(),
    hypothesisId: t.string(),
    focused: t.bool(),
  },
  (ctx, { caseId, hypothesisId, focused }) => {
    if (!caseId || caseId.trim().length === 0) {
      throw new SenderError("caseId must not be empty");
    }
    if (!hypothesisId || hypothesisId.trim().length === 0) {
      throw new SenderError("hypothesisId must not be empty");
    }

    ensurePlayerProfile(ctx);
    ensureMindCaseActive(ctx, caseId);
    ensureMindHypothesisForCase(ctx, caseId, hypothesisId);

    const focusFlagKey = createHypothesisFocusFlagKey(caseId, hypothesisId);
    upsertFlag(ctx, focusFlagKey, focused);

    emitTelemetry(ctx, "mind_hypothesis_focus_changed", {
      caseId,
      hypothesisId,
      focused,
    });
  },
);
