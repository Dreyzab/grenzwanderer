import { Timestamp } from "spacetimedb";
import { SenderError } from "spacetimedb/server";
import { identityKey } from "./map_keys";
import { assertNonEmpty } from "./payload_json";

const IDEMPOTENCY_TTL_MICROS = 86_400_000_000n;

export const ensureIdempotent = (
  ctx: any,
  requestId: string,
  operation: string,
): void => {
  assertNonEmpty(requestId, "requestId");
  assertNonEmpty(operation, "operation");

  const idempotencyKey = `${identityKey(ctx.sender)}::${requestId}`;
  const existing = ctx.db.idempotencyLog.idempotencyKey.find(idempotencyKey);
  if (existing) {
    throw new SenderError(`Duplicate request for ${operation}`);
  }

  ctx.db.idempotencyLog.insert({
    idempotencyKey,
    playerId: ctx.sender,
    requestId,
    operation,
    createdAt: ctx.timestamp,
    expiresAt: new Timestamp(
      ctx.timestamp.microsSinceUnixEpoch + IDEMPOTENCY_TTL_MICROS,
    ),
  });
};
