import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  closeCommandModeInternal,
  emitTelemetry,
  ensureIdempotent,
  ensurePlayerProfile,
  issueCommandInternal,
  openCommandModeInternal,
  resolveCommandInternal,
  type CommandReturnTab,
} from "./helpers/all";

const isCommandReturnTab = (value: string): value is CommandReturnTab =>
  value === "map" || value === "vn";

export const open_command_mode = spacetimedb.reducer(
  {
    requestId: t.string(),
    scenarioId: t.string(),
    returnTab: t.string().optional(),
    sourceTab: t.string().optional(),
  },
  (ctx, { requestId, scenarioId, returnTab, sourceTab }) => {
    if (!scenarioId || scenarioId.trim().length === 0) {
      throw new SenderError("scenarioId must not be empty");
    }

    const nextReturnTab =
      returnTab && isCommandReturnTab(returnTab) ? returnTab : undefined;
    const nextSourceTab =
      sourceTab && isCommandReturnTab(sourceTab) ? sourceTab : undefined;

    ensureIdempotent(ctx, requestId, "open_command_mode");
    ensurePlayerProfile(ctx);
    openCommandModeInternal(ctx, scenarioId, {
      returnTab: nextReturnTab,
      sourceTab: nextSourceTab,
    });
  },
);

export const issue_command = spacetimedb.reducer(
  {
    requestId: t.string(),
    orderId: t.string(),
  },
  (ctx, { requestId, orderId }) => {
    if (!orderId || orderId.trim().length === 0) {
      throw new SenderError("orderId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "issue_command");
    ensurePlayerProfile(ctx);
    issueCommandInternal(ctx, orderId);
  },
);

export const resolve_command = spacetimedb.reducer(
  {
    requestId: t.string(),
  },
  (ctx, { requestId }) => {
    ensureIdempotent(ctx, requestId, "resolve_command");
    ensurePlayerProfile(ctx);
    resolveCommandInternal(ctx);
  },
);

export const close_command_mode = spacetimedb.reducer(
  {
    requestId: t.string(),
  },
  (ctx, { requestId }) => {
    ensureIdempotent(ctx, requestId, "close_command_mode");
    ensurePlayerProfile(ctx);
    closeCommandModeInternal(ctx);
    emitTelemetry(ctx, "command_mode_returned", {
      player: ctx.sender.toHexString(),
    });
  },
);
