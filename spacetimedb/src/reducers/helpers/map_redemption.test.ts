import { describe, expect, it, vi } from "vitest";

import {
  createReducerTestContext,
  createTestIdentity,
  createTestTimestamp,
  playerKey,
} from "./__tests__/serverTestContext";
import {
  MAP_CODE_RETRY_COOLDOWN_MICROS,
  hasPriorSuccessfulRedeem,
  hasRecentRejectedRedeem,
} from "./map_redemption";

const insertRedeem = (
  ctx: ReturnType<typeof createReducerTestContext>,
  overrides: {
    codeId: string;
    playerId?: ReturnType<typeof createTestIdentity>;
    redeemedAt?: ReturnType<typeof createTestTimestamp>;
    result: string;
  },
): void => {
  const playerId = overrides.playerId ?? ctx.sender;
  ctx.db.playerRedeemedCode.insert({
    redemptionId: playerKey(
      playerId,
      `${overrides.codeId}:${overrides.result}`,
    ),
    playerId,
    codeId: overrides.codeId,
    requestId: `request:${overrides.codeId}:${overrides.result}`,
    redeemedAt: overrides.redeemedAt ?? ctx.timestamp,
    result: overrides.result,
  });
};

describe("map redemption lookups", () => {
  it("uses the player/code/result composite index for successful redeems", () => {
    const ctx = createReducerTestContext();
    const other = createTestIdentity("other-player");
    ctx.db.playerRedeemedCode.player_redeemed_code_code_id = {
      filter: vi.fn(() => {
        throw new Error("code_id index should not be used");
      }),
    };

    insertRedeem(ctx, {
      codeId: "qr-local",
      playerId: other,
      result: "applied",
    });

    expect(hasPriorSuccessfulRedeem(ctx, "qr-local")).toBe(false);

    insertRedeem(ctx, {
      codeId: "qr-local",
      result: "queued_after_briefing",
    });

    expect(hasPriorSuccessfulRedeem(ctx, "qr-local")).toBe(true);
    expect(
      ctx.db.playerRedeemedCode.player_redeemed_code_code_id.filter,
    ).not.toHaveBeenCalled();
  });

  it("checks rejected cooldowns without scanning other results or players", () => {
    const now = 1_000_000_000n;
    const ctx = createReducerTestContext({
      timestamp: createTestTimestamp(now),
    });
    const other = createTestIdentity("other-player");
    ctx.db.playerRedeemedCode.player_redeemed_code_code_id = {
      filter: vi.fn(() => {
        throw new Error("code_id index should not be used");
      }),
    };

    insertRedeem(ctx, {
      codeId: "qr-cooldown",
      playerId: other,
      redeemedAt: createTestTimestamp(now - 1n),
      result: "outside_geofence",
    });
    insertRedeem(ctx, {
      codeId: "qr-cooldown",
      redeemedAt: createTestTimestamp(
        now - MAP_CODE_RETRY_COOLDOWN_MICROS - 1n,
      ),
      result: "location_required",
    });

    expect(hasRecentRejectedRedeem(ctx, "qr-cooldown", now)).toBe(false);

    insertRedeem(ctx, {
      codeId: "qr-cooldown",
      redeemedAt: createTestTimestamp(now - 1n),
      result: "blocked_flags",
    });

    expect(hasRecentRejectedRedeem(ctx, "qr-cooldown", now)).toBe(true);
    expect(
      ctx.db.playerRedeemedCode.player_redeemed_code_code_id.filter,
    ).not.toHaveBeenCalled();
  });
});
