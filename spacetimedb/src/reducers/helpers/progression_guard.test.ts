import { describe, expect, it, vi } from "vitest";

import { createReducerTestContext } from "./__tests__/serverTestContext";

vi.mock("spacetimedb", () => ({
  Timestamp: class Timestamp {
    microsSinceUnixEpoch: bigint;

    constructor(microsSinceUnixEpoch: bigint) {
      this.microsSinceUnixEpoch = microsSinceUnixEpoch;
    }
  },
}));

vi.mock("spacetimedb/server", () => ({
  SenderError: class SenderError extends Error {},
}));

import { SenderError } from "spacetimedb/server";
import {
  assertClientSetFlagAllowed,
  assertDirectProgressionReducerAllowed,
  assertVnInteractiveEvidenceAllowed,
} from "./progression_guard";

describe("progression_guard", () => {
  it("blocks direct progression reducers for regular players", () => {
    const ctx = createReducerTestContext();
    expect(() =>
      assertDirectProgressionReducerAllowed(ctx, "grant_xp"),
    ).toThrow(SenderError);
  });

  it("allows map discovery flags for regular players", () => {
    const ctx = createReducerTestContext();
    expect(() =>
      assertClientSetFlagAllowed(ctx, "DISCOVERED_loc_hbf"),
    ).not.toThrow();
    expect(() =>
      assertClientSetFlagAllowed(ctx, "VISITED_loc_hbf"),
    ).not.toThrow();
  });

  it("blocks gameplay flags for regular players", () => {
    const ctx = createReducerTestContext();
    expect(() =>
      assertClientSetFlagAllowed(ctx, "case_banker_theft_solved"),
    ).toThrow(SenderError);
  });

  it("allows admin identities to bypass direct progression reducers", () => {
    const ctx = createReducerTestContext();
    ctx.db.adminIdentity.insert({
      identity: ctx.sender,
      grantedAt: ctx.timestamp,
      grantedBy: undefined,
    });

    expect(() =>
      assertDirectProgressionReducerAllowed(ctx, "grant_xp"),
    ).not.toThrow();
    expect(() =>
      assertClientSetFlagAllowed(ctx, "case_banker_theft_solved"),
    ).not.toThrow();
  });

  it("requires interactive clue tokens for grant_evidence", () => {
    const ctx = createReducerTestContext();
    expect(() =>
      assertVnInteractiveEvidenceAllowed(ctx, "ev_station_steam"),
    ).toThrow(SenderError);
  });
});
