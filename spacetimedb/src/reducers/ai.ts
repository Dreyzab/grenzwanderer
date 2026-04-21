import { Timestamp } from "spacetimedb";
import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  addToVarForPlayer,
  emitTelemetry,
  ensureAdminIdentity,
  ensureAllowlistedWorker,
  ensureIdempotent,
  ensureNarrativeResources,
  ensurePlayerProfile,
  ensureNarrativeResourcesForPlayer,
  getVarForPlayer,
} from "./helpers";
import {
  AI_REQUEST_STATUS_COMPLETED,
  AI_REQUEST_STATUS_FAILED,
  AI_REQUEST_STATUS_PENDING,
  AI_REQUEST_STATUS_PROCESSING,
  getLeaseMutationError,
  isClaimEligible,
  isSupportedAiKind,
  selectClaimCandidate,
  type SupportedAiKind,
} from "./aiQueue";
import {
  AI_GENERATE_DIALOGUE_KIND,
  parseGenerateDialoguePayload,
} from "../../../src/features/ai/contracts";
import { RESOURCE_PROVIDENCE_VAR } from "../../../src/shared/game/narrativeResources";

const MICROS_PER_MILLISECOND = 1_000n;

const requireRegisteredWorker = (
  ctx: any,
  operation: string,
): { workerHex: string } => {
  ensureAllowlistedWorker(ctx, operation);

  const worker = ctx.db.workerIdentity.identity.find(ctx.sender);
  if (!worker) {
    throw new SenderError(`Only a registered worker can ${operation}`);
  }

  return {
    workerHex: ctx.sender.toHexString(),
  };
};

const requireNonEmptyString = (value: string, fieldName: string): string => {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new SenderError(`${fieldName} must not be empty`);
  }

  return normalized;
};

const requireSupportedAiKind = (kind: string): SupportedAiKind => {
  const normalized = requireNonEmptyString(kind, "kind");
  if (!isSupportedAiKind(normalized)) {
    throw new SenderError(`Unsupported AI kind '${normalized}'`);
  }

  return normalized;
};

const parseDialoguePayloadOrThrow = (payloadJson: string) => {
  const payload = parseGenerateDialoguePayload(payloadJson);
  if (!payload) {
    throw new SenderError("payloadJson must contain a valid GenerateDialoguePayload");
  }
  return payload;
};

const isProvidenceDialoguePayload = (
  payloadJson: string,
): { providenceCost: number } | null => {
  const payload = parseGenerateDialoguePayload(payloadJson);
  if (
    !payload ||
    payload.source !== "vn_skill_check" ||
    payload.dialogueLayer !== "providence"
  ) {
    return null;
  }

  return {
    providenceCost: Math.max(0, Math.trunc(payload.providenceCost ?? 0)),
  };
};

const requirePositiveMilliseconds = (
  value: number,
  fieldName: string,
): bigint => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new SenderError(`${fieldName} must be a positive integer`);
  }

  return BigInt(value) * MICROS_PER_MILLISECOND;
};

const identityHexOf = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "toHexString" in value) {
    const identity = value as { toHexString?: () => string };
    return typeof identity.toHexString === "function"
      ? identity.toHexString()
      : null;
  }

  return null;
};

const clearClaimState = () => ({
  claimedBy: undefined,
  claimToken: undefined,
  claimedAt: undefined,
  leaseExpiresAt: undefined,
});

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
    const supportedKind = requireSupportedAiKind(kind);

    ensureIdempotent(ctx, requestId, "enqueue_ai_request");
    ensurePlayerProfile(ctx);

    ctx.db.aiRequest.insert({
      id: 0n,
      playerId: ctx.sender,
      requestId,
      kind: supportedKind,
      payloadJson,
      status: AI_REQUEST_STATUS_PENDING,
      responseJson: undefined,
      error: undefined,
      attemptCount: 0,
      claimedBy: undefined,
      claimToken: undefined,
      claimedAt: undefined,
      leaseExpiresAt: undefined,
      nextRetryAt: undefined,
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });

    emitTelemetry(ctx, "ai_request_enqueued", {
      requestId,
      kind: supportedKind,
    });
  },
);

export const enqueue_providence_dialogue = spacetimedb.reducer(
  {
    requestId: t.string(),
    scenarioId: t.string(),
    nodeId: t.string(),
    checkId: t.string(),
    choiceId: t.string(),
    providenceCost: t.u32(),
    payloadJson: t.string(),
  },
  (
    ctx,
    { requestId, scenarioId, nodeId, checkId, choiceId, providenceCost, payloadJson },
  ) => {
    ensureIdempotent(ctx, requestId, "enqueue_providence_dialogue");
    ensurePlayerProfile(ctx);
    ensureNarrativeResources(ctx);

    const payload = parseDialoguePayloadOrThrow(payloadJson);
    if (payload.source !== "vn_skill_check") {
      throw new SenderError("Providence dialogue payload must come from a skill check");
    }
    if (payload.dialogueLayer !== "providence") {
      throw new SenderError("Providence dialogue payload must declare dialogueLayer='providence'");
    }
    if (payload.scenarioId !== scenarioId) {
      throw new SenderError("Providence dialogue scenarioId mismatch");
    }
    if (payload.nodeId !== nodeId) {
      throw new SenderError("Providence dialogue nodeId mismatch");
    }
    if (payload.checkId !== checkId) {
      throw new SenderError("Providence dialogue checkId mismatch");
    }
    if (payload.choiceId !== choiceId) {
      throw new SenderError("Providence dialogue choiceId mismatch");
    }

    const normalizedProvidenceCost = Math.max(0, Math.trunc(providenceCost));
    if (Math.max(0, Math.trunc(payload.providenceCost ?? 0)) !== normalizedProvidenceCost) {
      throw new SenderError("Providence dialogue cost mismatch");
    }

    const currentProvidence = Math.trunc(
      getVarForPlayer(ctx, ctx.sender, RESOURCE_PROVIDENCE_VAR),
    );
    if (currentProvidence < normalizedProvidenceCost) {
      throw new SenderError("Not enough Providence");
    }

    if (normalizedProvidenceCost > 0) {
      addToVarForPlayer(
        ctx,
        ctx.sender,
        RESOURCE_PROVIDENCE_VAR,
        -normalizedProvidenceCost,
      );
    }

    ctx.db.aiRequest.insert({
      id: 0n,
      playerId: ctx.sender,
      requestId,
      kind: AI_GENERATE_DIALOGUE_KIND,
      payloadJson,
      status: AI_REQUEST_STATUS_PENDING,
      responseJson: undefined,
      error: undefined,
      attemptCount: 0,
      claimedBy: undefined,
      claimToken: undefined,
      claimedAt: undefined,
      leaseExpiresAt: undefined,
      nextRetryAt: undefined,
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });

    emitTelemetry(ctx, "providence_dialogue_enqueued", {
      requestId,
      scenarioId,
      nodeId,
      checkId,
      choiceId,
      providenceCost: normalizedProvidenceCost,
    });
  },
);

export const claim_next_ai_request = spacetimedb.reducer(
  {
    requestId: t.string(),
    kind: t.string(),
    leaseMs: t.u32(),
    claimToken: t.string(),
  },
  (ctx, { requestId, kind, leaseMs, claimToken }) => {
    const { workerHex } = requireRegisteredWorker(ctx, "claim ai requests");
    const supportedKind = requireSupportedAiKind(kind);
    const normalizedClaimToken = requireNonEmptyString(
      claimToken,
      "claimToken",
    );
    const leaseMicros = requirePositiveMilliseconds(Number(leaseMs), "leaseMs");
    const nowMicros = ctx.timestamp.microsSinceUnixEpoch;
    const candidate = selectClaimCandidate(
      [...ctx.db.aiRequest.iter()],
      supportedKind,
      nowMicros,
    );

    if (!candidate) {
      return;
    }

    ensureIdempotent(ctx, requestId, "claim_next_ai_request");

    const request = ctx.db.aiRequest.id.find(candidate.id);
    if (!request || !isClaimEligible(request, supportedKind, nowMicros)) {
      return;
    }

    ctx.db.aiRequest.id.update({
      ...request,
      status: AI_REQUEST_STATUS_PROCESSING,
      responseJson: undefined,
      error: undefined,
      attemptCount: request.attemptCount + 1,
      claimedBy: ctx.sender,
      claimToken: normalizedClaimToken,
      claimedAt: ctx.timestamp,
      leaseExpiresAt: new Timestamp(nowMicros + leaseMicros),
      nextRetryAt: undefined,
      updatedAt: ctx.timestamp,
    });

    emitTelemetry(ctx, "ai_request_claimed", {
      aiRequestId: request.id.toString(),
      kind: supportedKind,
      worker: workerHex,
    });
  },
);

export const renew_ai_request_lease = spacetimedb.reducer(
  {
    requestId: t.string(),
    aiRequestId: t.u64(),
    leaseMs: t.u32(),
  },
  (ctx, { requestId, aiRequestId, leaseMs }) => {
    const { workerHex } = requireRegisteredWorker(
      ctx,
      "renew ai request leases",
    );
    const leaseMicros = requirePositiveMilliseconds(Number(leaseMs), "leaseMs");

    ensureIdempotent(ctx, requestId, "renew_ai_request_lease");

    const request = ctx.db.aiRequest.id.find(aiRequestId);
    if (!request) {
      throw new SenderError("aiRequestId not found");
    }

    const leaseMutationError = getLeaseMutationError(
      {
        status: request.status,
        claimedByHex: identityHexOf(request.claimedBy),
      },
      workerHex,
    );
    if (leaseMutationError) {
      throw new SenderError(leaseMutationError);
    }

    ctx.db.aiRequest.id.update({
      ...request,
      leaseExpiresAt: new Timestamp(
        ctx.timestamp.microsSinceUnixEpoch + leaseMicros,
      ),
      updatedAt: ctx.timestamp,
    });
  },
);

export const complete_ai_request = spacetimedb.reducer(
  {
    requestId: t.string(),
    aiRequestId: t.u64(),
    responseJson: t.string(),
  },
  (ctx, { requestId, aiRequestId, responseJson }) => {
    const { workerHex } = requireRegisteredWorker(ctx, "complete ai requests");
    const normalizedResponseJson = requireNonEmptyString(
      responseJson,
      "responseJson",
    );

    ensureIdempotent(ctx, requestId, "complete_ai_request");

    const request = ctx.db.aiRequest.id.find(aiRequestId);
    if (!request) {
      throw new SenderError("aiRequestId not found");
    }

    const leaseMutationError = getLeaseMutationError(
      {
        status: request.status,
        claimedByHex: identityHexOf(request.claimedBy),
      },
      workerHex,
    );
    if (leaseMutationError) {
      throw new SenderError(leaseMutationError);
    }

    ctx.db.aiRequest.id.update({
      ...request,
      status: AI_REQUEST_STATUS_COMPLETED,
      responseJson: normalizedResponseJson,
      error: undefined,
      nextRetryAt: undefined,
      ...clearClaimState(),
      updatedAt: ctx.timestamp,
    });

    emitTelemetry(ctx, "ai_request_delivered", {
      aiRequestId: aiRequestId.toString(),
      status: AI_REQUEST_STATUS_COMPLETED,
      worker: workerHex,
    });
  },
);

export const fail_ai_request = spacetimedb.reducer(
  {
    requestId: t.string(),
    aiRequestId: t.u64(),
    error: t.string(),
    retryDelayMs: t.u32().optional(),
  },
  (ctx, { requestId, aiRequestId, error, retryDelayMs }) => {
    const { workerHex } = requireRegisteredWorker(ctx, "fail ai requests");
    const normalizedError = requireNonEmptyString(error, "error");
    const retryDelayMicros =
      retryDelayMs === undefined
        ? undefined
        : requirePositiveMilliseconds(Number(retryDelayMs), "retryDelayMs");

    ensureIdempotent(ctx, requestId, "fail_ai_request");

    const request = ctx.db.aiRequest.id.find(aiRequestId);
    if (!request) {
      throw new SenderError("aiRequestId not found");
    }

    const leaseMutationError = getLeaseMutationError(
      {
        status: request.status,
        claimedByHex: identityHexOf(request.claimedBy),
      },
      workerHex,
    );
    if (leaseMutationError) {
      throw new SenderError(leaseMutationError);
    }

    const nextRetryAt =
      retryDelayMicros === undefined
        ? undefined
        : new Timestamp(ctx.timestamp.microsSinceUnixEpoch + retryDelayMicros);
    const nextStatus =
      retryDelayMicros === undefined
        ? AI_REQUEST_STATUS_FAILED
        : AI_REQUEST_STATUS_PENDING;

    ctx.db.aiRequest.id.update({
      ...request,
      status: nextStatus,
      responseJson: undefined,
      error: normalizedError,
      nextRetryAt,
      ...clearClaimState(),
      updatedAt: ctx.timestamp,
    });

    if (nextStatus === AI_REQUEST_STATUS_PENDING) {
      emitTelemetry(ctx, "ai_request_retry_scheduled", {
        aiRequestId: aiRequestId.toString(),
        worker: workerHex,
      });
      return;
    }

    const providencePayload = isProvidenceDialoguePayload(request.payloadJson);
    if (providencePayload && providencePayload.providenceCost > 0) {
      ensureNarrativeResourcesForPlayer(ctx, request.playerId);
      addToVarForPlayer(
        ctx,
        request.playerId,
        RESOURCE_PROVIDENCE_VAR,
        providencePayload.providenceCost,
      );
      emitTelemetry(ctx, "providence_dialogue_refunded", {
        aiRequestId: aiRequestId.toString(),
        providenceCost: providencePayload.providenceCost,
        playerId: request.playerId.toHexString(),
      });
    }

    emitTelemetry(ctx, "ai_request_delivered", {
      aiRequestId: aiRequestId.toString(),
      status: AI_REQUEST_STATUS_FAILED,
      worker: workerHex,
    });
  },
);

export const requeue_ai_request = spacetimedb.reducer(
  {
    requestId: t.string(),
    aiRequestId: t.u64(),
  },
  (ctx, { requestId, aiRequestId }) => {
    ensureAdminIdentity(ctx, "requeue failed ai requests");
    ensureIdempotent(ctx, requestId, "requeue_ai_request");

    const request = ctx.db.aiRequest.id.find(aiRequestId);
    if (!request) {
      throw new SenderError("aiRequestId not found");
    }
    if (isProvidenceDialoguePayload(request.payloadJson)) {
      throw new SenderError(
        "Providence dialogue requests cannot be requeued in v1",
      );
    }
    if (request.status !== AI_REQUEST_STATUS_FAILED) {
      throw new SenderError("Only failed ai_request rows can be requeued");
    }

    ctx.db.aiRequest.id.update({
      ...request,
      status: AI_REQUEST_STATUS_PENDING,
      responseJson: undefined,
      error: undefined,
      attemptCount: 0,
      nextRetryAt: undefined,
      ...clearClaimState(),
      updatedAt: ctx.timestamp,
    });

    emitTelemetry(ctx, "ai_request_requeued", {
      aiRequestId: aiRequestId.toString(),
      requeuedBy: ctx.sender.toHexString(),
    });
  },
);
