import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import { CASE_CATALOG } from "../../../src/shared/vn-contract";
import {
  emitCaseEvent,
  emitTelemetry,
  ensureIdempotent,
  ensurePlayerProfile,
  processCaseEventTriggers,
} from "./helpers";

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
    const eventRow = emitCaseEvent(ctx, {
      eventName,
      payloadJson,
      caseId,
      scenarioId,
      nodeId,
      questInstanceId,
      idempotencyKey: requestId,
    });
    processCaseEventTriggers(ctx, CASE_CATALOG, {
      eventName: eventRow.eventName,
      scope: {
        caseId: eventRow.caseId,
        scenarioId: eventRow.scenarioId,
        nodeId: eventRow.nodeId,
        questInstanceId: eventRow.questInstanceId,
      },
      idempotencyKey: eventRow.idempotencyKey,
      payload: JSON.parse(eventRow.payloadJson) as Record<string, unknown>,
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
