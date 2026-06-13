import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  assertHypothesisInternal,
  createHypothesisFocusFlagKey,
  createPlayerMindCaseKey,
  discoverFactInternal,
  emitTelemetry,
  ensureIdempotent,
  ensureMindCaseActive,
  ensureMindHypothesisForCase,
  ensurePlayerProfile,
  linkFactInternal,
  saveBoardLayoutInternal,
  unlinkFactInternal,
  upsertFlag,
} from "./helpers";
import { assertVnInteractiveDiscoverFactAllowed } from "./helpers/progression_guard";

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
    ensurePlayerProfile(ctx);
    assertVnInteractiveDiscoverFactAllowed(ctx, caseId, factId);
    discoverFactInternal(ctx, caseId, factId, {
      sourceType: "reducer",
      sourceId: "discover_fact",
    });
  },
);

export const link_fact = spacetimedb.reducer(
  {
    requestId: t.string(),
    caseId: t.string(),
    factId: t.string(),
    hypothesisId: t.string(),
  },
  (ctx, { requestId, caseId, factId, hypothesisId }) => {
    if (!caseId || caseId.trim().length === 0) {
      throw new SenderError("caseId must not be empty");
    }
    if (!factId || factId.trim().length === 0) {
      throw new SenderError("factId must not be empty");
    }
    if (!hypothesisId || hypothesisId.trim().length === 0) {
      throw new SenderError("hypothesisId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "link_fact");
    linkFactInternal(ctx, caseId, factId, hypothesisId);
  },
);

export const unlink_fact = spacetimedb.reducer(
  {
    requestId: t.string(),
    caseId: t.string(),
    factId: t.string(),
    hypothesisId: t.string(),
  },
  (ctx, { requestId, caseId, factId, hypothesisId }) => {
    if (!caseId || caseId.trim().length === 0) {
      throw new SenderError("caseId must not be empty");
    }
    if (!factId || factId.trim().length === 0) {
      throw new SenderError("factId must not be empty");
    }
    if (!hypothesisId || hypothesisId.trim().length === 0) {
      throw new SenderError("hypothesisId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "unlink_fact");
    unlinkFactInternal(ctx, caseId, factId, hypothesisId);
  },
);

export const save_board_layout = spacetimedb.reducer(
  {
    caseId: t.string(),
    layoutJson: t.string(),
  },
  (ctx, { caseId, layoutJson }) => {
    if (!caseId || caseId.trim().length === 0) {
      throw new SenderError("caseId must not be empty");
    }

    saveBoardLayoutInternal(ctx, caseId, layoutJson);
  },
);

export const assert_hypothesis = spacetimedb.reducer(
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

    ensureIdempotent(ctx, requestId, "assert_hypothesis");
    assertHypothesisInternal(ctx, caseId, hypothesisId);
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
