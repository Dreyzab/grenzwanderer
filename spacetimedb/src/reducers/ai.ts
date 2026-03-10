import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  emitTelemetry,
  ensureAllowlistedWorker,
  ensureIdempotent,
  ensurePlayerProfile,
} from "./helpers";

const AI_STATUSES = new Set(["processing", "completed", "failed"]);

export const register_worker_identity = spacetimedb.reducer((ctx) => {
  ensureAllowlistedWorker(ctx, "register worker identities");

  const existing = ctx.db.workerIdentity.identity.find(ctx.sender);
  if (existing) {
    return;
  }

  ctx.db.workerIdentity.insert({ identity: ctx.sender });
  emitTelemetry(ctx, "worker_identity_registered", {
    worker: ctx.sender.toHexString(),
  });
});

export const enqueue_ai_request = spacetimedb.reducer(
  {
    requestId: t.string(),
    kind: t.string(),
    payloadJson: t.string(),
  },
  (ctx, { requestId, kind, payloadJson }) => {
    if (!kind || kind.trim().length === 0) {
      throw new SenderError("kind must not be empty");
    }

    ensureIdempotent(ctx, requestId, "enqueue_ai_request");
    ensurePlayerProfile(ctx);

    ctx.db.aiRequest.insert({
      id: 0n,
      playerId: ctx.sender,
      requestId,
      kind,
      payloadJson,
      status: "pending",
      responseJson: undefined,
      error: undefined,
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });

    emitTelemetry(ctx, "ai_request_enqueued", {
      requestId,
      kind,
    });
  },
);

export const deliver_thought = spacetimedb.reducer(
  {
    requestId: t.string(),
    aiRequestId: t.u64(),
    status: t.string(),
    responseJson: t.string().optional(),
    error: t.string().optional(),
  },
  (ctx, { requestId, aiRequestId, status, responseJson, error }) => {
    ensureAllowlistedWorker(ctx, "deliver thoughts");
    ensureIdempotent(ctx, requestId, "deliver_thought");

    const worker = ctx.db.workerIdentity.identity.find(ctx.sender);
    if (!worker) {
      throw new SenderError("Only a registered worker can deliver thoughts");
    }

    if (!AI_STATUSES.has(status)) {
      throw new SenderError("status must be processing, completed, or failed");
    }

    if (
      status === "completed" &&
      (!responseJson || responseJson.trim().length === 0)
    ) {
      throw new SenderError("responseJson is required for completed status");
    }

    const request = ctx.db.aiRequest.id.find(aiRequestId);
    if (!request) {
      throw new SenderError("aiRequestId not found");
    }

    ctx.db.aiRequest.id.update({
      ...request,
      status,
      responseJson,
      error,
      updatedAt: ctx.timestamp,
    });

    emitTelemetry(ctx, "ai_request_delivered", {
      aiRequestId: aiRequestId.toString(),
      status,
      worker: ctx.sender.toHexString(),
    });
  },
);
