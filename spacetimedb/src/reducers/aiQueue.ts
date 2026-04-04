export const AI_GENERATE_DIALOGUE_KIND = "generate_dialogue";

export const AI_REQUEST_STATUS_PENDING = "pending";
export const AI_REQUEST_STATUS_PROCESSING = "processing";
export const AI_REQUEST_STATUS_COMPLETED = "completed";
export const AI_REQUEST_STATUS_FAILED = "failed";

export const SUPPORTED_AI_KINDS = [AI_GENERATE_DIALOGUE_KIND] as const;

export type SupportedAiKind = (typeof SUPPORTED_AI_KINDS)[number];

export interface TimestampLike {
  microsSinceUnixEpoch: bigint;
}

export interface ClaimCandidateLike {
  id: bigint;
  kind: string;
  status: string;
  nextRetryAt?: TimestampLike | null;
  leaseExpiresAt?: TimestampLike | null;
}

export interface LeaseOwnedAiRequestLike {
  status: string;
  claimedByHex?: string | null;
}

const CLAIMABLE_STATUSES = new Set([
  AI_REQUEST_STATUS_PENDING,
  AI_REQUEST_STATUS_PROCESSING,
]);

export const isSupportedAiKind = (kind: string): kind is SupportedAiKind =>
  SUPPORTED_AI_KINDS.includes(kind as SupportedAiKind);

export const isClaimEligible = (
  row: ClaimCandidateLike,
  kind: SupportedAiKind,
  nowMicros: bigint,
): boolean => {
  if (row.kind !== kind || !CLAIMABLE_STATUSES.has(row.status)) {
    return false;
  }

  if (row.status === AI_REQUEST_STATUS_PENDING) {
    return (
      !row.nextRetryAt || row.nextRetryAt.microsSinceUnixEpoch <= nowMicros
    );
  }

  return (
    !!row.leaseExpiresAt && row.leaseExpiresAt.microsSinceUnixEpoch <= nowMicros
  );
};

export const compareClaimCandidates = (
  left: ClaimCandidateLike,
  right: ClaimCandidateLike,
): number => {
  if (left.id === right.id) {
    return 0;
  }

  return left.id < right.id ? -1 : 1;
};

export const selectClaimCandidate = (
  rows: readonly ClaimCandidateLike[],
  kind: SupportedAiKind,
  nowMicros: bigint,
): ClaimCandidateLike | null => {
  const eligible = rows
    .filter((row) => isClaimEligible(row, kind, nowMicros))
    .sort(compareClaimCandidates);

  return eligible[0] ?? null;
};

export const getLeaseMutationError = (
  row: LeaseOwnedAiRequestLike,
  workerIdentityHex: string,
): string | null => {
  if (row.status !== AI_REQUEST_STATUS_PROCESSING) {
    return "ai_request must be processing";
  }

  if (!row.claimedByHex) {
    return "ai_request is not currently claimed";
  }

  if (row.claimedByHex !== workerIdentityHex) {
    return "Only the worker that claimed this ai_request may mutate it";
  }

  return null;
};
