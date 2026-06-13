import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  emitTelemetry,
  ensureIdempotent,
  ensurePlayerProfile,
  publishCaseEvent,
} from "./helpers";
import { assertDirectProgressionReducerAllowed } from "./helpers/progression_guard";

export const emit_case_event = spacetimedb.reducer(
  {
    requestId: t.string(),
    eventName: t.string(),
    payloadJson: t.string(),
    caseId: t.string().optional(),
    scenarioId: t.string().optional(),
    nodeId: t.string().optional(),
    questInstanceId: t.string().optional(),
  },
  (
    ctx,
    {
      requestId,
      eventName,
      payloadJson,
      caseId,
      scenarioId,
      nodeId,
      questInstanceId,
    },
  ) => {
    if (!eventName || eventName.trim().length === 0) {
      throw new SenderError("eventName must not be empty");
    }

    ensurePlayerProfile(ctx);
    ensureIdempotent(ctx, requestId, "emit_case_event");
    assertDirectProgressionReducerAllowed(ctx, "emit_case_event");
    publishCaseEvent(ctx, {
      eventName,
      payloadJson,
      caseId,
      scenarioId,
      nodeId,
      questInstanceId,
      idempotencyKey: requestId,
    });
    emitTelemetry(ctx, "case_event_recorded", {
      eventName,
      caseId,
      scenarioId,
      nodeId,
      questInstanceId,
    });
  },
);
