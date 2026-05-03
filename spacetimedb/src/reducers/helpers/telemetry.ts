import { SenderError } from "spacetimedb/server";

const assertNonEmpty = (value: string, fieldName: string): void => {
  if (!value || value.trim().length === 0) {
    throw new SenderError(`${fieldName} must not be empty`);
  }
};

export const emitTelemetry = (
  ctx: any,
  eventName: string,
  tags: Record<string, unknown> = {},
  value?: number,
): void => {
  assertNonEmpty(eventName, "eventName");
  ctx.db.telemetryEvent.insert({
    eventId: 0n,
    playerId: ctx.sender,
    eventName,
    tagsJson: JSON.stringify(tags),
    value,
    createdAt: ctx.timestamp,
  });
};
