import { describe, expect, it } from "vitest";

import {
  AI_GENERATE_DIALOGUE_KIND,
  AI_REQUEST_STATUS_FAILED,
  AI_REQUEST_STATUS_PENDING,
  AI_REQUEST_STATUS_PROCESSING,
  getLeaseMutationError,
  isSupportedAiKind,
  selectClaimCandidate,
  type ClaimCandidateLike,
} from "./aiQueue";

const timestamp = (microsSinceUnixEpoch: bigint) => ({
  microsSinceUnixEpoch,
});

const row = (
  overrides: Partial<ClaimCandidateLike> & Pick<ClaimCandidateLike, "id">,
): ClaimCandidateLike => {
  const { id, ...rest } = overrides;
  return {
    id,
    kind: AI_GENERATE_DIALOGUE_KIND,
    status: AI_REQUEST_STATUS_PENDING,
    nextRetryAt: undefined,
    leaseExpiresAt: undefined,
    ...rest,
  };
};

describe("aiQueue", () => {
  it("accepts only the supported AI kind for v1", () => {
    expect(isSupportedAiKind(AI_GENERATE_DIALOGUE_KIND)).toBe(true);
    expect(isSupportedAiKind("summary")).toBe(false);
    expect(isSupportedAiKind("generate_character_reaction")).toBe(false);
  });

  it("claims the oldest eligible pending generate_dialogue job", () => {
    const candidate = selectClaimCandidate(
      [
        row({ id: 5n }),
        row({
          id: 3n,
          nextRetryAt: timestamp(2_000n),
        }),
        row({ id: 1n }),
      ],
      AI_GENERATE_DIALOGUE_KIND,
      1_000n,
    );

    expect(candidate?.id).toBe(1n);
  });

  it("reclaims expired processing jobs but skips active leases", () => {
    const candidate = selectClaimCandidate(
      [
        row({
          id: 10n,
          status: AI_REQUEST_STATUS_PROCESSING,
          leaseExpiresAt: timestamp(500n),
        }),
        row({
          id: 2n,
          status: AI_REQUEST_STATUS_PROCESSING,
          leaseExpiresAt: timestamp(5_000n),
        }),
        row({
          id: 1n,
          kind: "summary",
        }),
      ],
      AI_GENERATE_DIALOGUE_KIND,
      1_000n,
    );

    expect(candidate?.id).toBe(10n);
  });

  it("rejects lease mutations from non-owners and non-processing rows", () => {
    expect(
      getLeaseMutationError(
        {
          status: AI_REQUEST_STATUS_FAILED,
          claimedByHex: "worker-a",
        },
        "worker-a",
      ),
    ).toBe("ai_request must be processing");

    expect(
      getLeaseMutationError(
        {
          status: AI_REQUEST_STATUS_PROCESSING,
          claimedByHex: "worker-a",
        },
        "worker-b",
      ),
    ).toBe("Only the worker that claimed this ai_request may mutate it");

    expect(
      getLeaseMutationError(
        {
          status: AI_REQUEST_STATUS_PROCESSING,
          claimedByHex: "worker-a",
        },
        "worker-a",
      ),
    ).toBeNull();
  });
});
