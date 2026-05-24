import { SenderError } from "spacetimedb/server";

export interface CaseEventScopeInput {
  caseId?: string;
  scenarioId?: string;
  nodeId?: string;
  questInstanceId?: string;
}

export interface EmitCaseEventInput extends CaseEventScopeInput {
  eventName: string;
  payloadJson?: string;
  idempotencyKey: string;
}

export interface CaseEventLogRow extends Required<EmitCaseEventInput> {
  eventId: unknown;
  playerId: unknown;
  createdAt: unknown;
}

const assertNonEmpty = (value: string, fieldName: string): void => {
  if (!value || value.trim().length === 0) {
    throw new SenderError(`${fieldName} must not be empty`);
  }
};

export const parseCaseEventPayload = (
  payloadJson: string | undefined,
): string => {
  const candidate =
    payloadJson && payloadJson.trim().length > 0 ? payloadJson : "{}";
  try {
    JSON.parse(candidate);
  } catch (_error) {
    throw new SenderError("payloadJson must be valid JSON");
  }
  return candidate;
};

export const emitCaseEvent = (
  ctx: any,
  input: EmitCaseEventInput,
): CaseEventLogRow => {
  assertNonEmpty(input.eventName, "eventName");
  assertNonEmpty(input.idempotencyKey, "idempotencyKey");

  return ctx.db.caseEventLog.insert({
    eventId: 0n,
    playerId: ctx.sender,
    eventName: input.eventName,
    caseId: input.caseId,
    scenarioId: input.scenarioId,
    nodeId: input.nodeId,
    questInstanceId: input.questInstanceId,
    payloadJson: parseCaseEventPayload(input.payloadJson),
    idempotencyKey: input.idempotencyKey,
    createdAt: ctx.timestamp,
  });
};
