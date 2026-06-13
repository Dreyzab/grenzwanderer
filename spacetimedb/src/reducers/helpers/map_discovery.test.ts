import { describe, expect, it, vi } from "vitest";

import {
  createReducerTestContext,
  insertFlag,
  insertVar,
} from "./__tests__/serverTestContext";

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

import { createMapEvaluationCache } from "./map_conditions";
import { validateMapDiscovery } from "./map_discovery";
import type { MapDiscoveryRule, MapPoint } from "./types";

const POINT_LAT = 47.99;
const POINT_LNG = 7.85;

const testPoint = (overrides: Partial<MapPoint> = {}): MapPoint =>
  ({
    id: "point-a",
    title: "Point A",
    regionId: "region-test",
    lat: POINT_LAT,
    lng: POINT_LNG,
    category: "SHADOW",
    locationId: "loc-a",
    bindings: [],
    ...overrides,
  }) as MapPoint;

const atPoint = { lat: POINT_LAT, lng: POINT_LNG };
const farAway = { lat: POINT_LAT + 0.01, lng: POINT_LNG };

const validate = (
  ctx: ReturnType<typeof createReducerTestContext>,
  point: MapPoint,
  channel: string,
  attemptedLocation: { lat: number; lng: number } | null,
) =>
  validateMapDiscovery(ctx, point, {
    channel,
    attemptedLocation,
    cache: createMapEvaluationCache(),
  });

describe("map_discovery", () => {
  it("rejects channels the client may not commit", () => {
    const ctx = createReducerTestContext();
    expect(validate(ctx, testPoint(), "vn_unlock", atPoint)).toEqual({
      ok: false,
      reason: "discovery_channel_invalid",
    });
    expect(validate(ctx, testPoint(), "qr_scan", atPoint)).toEqual({
      ok: false,
      reason: "discovery_channel_invalid",
    });
  });

  it("requires an attempted location", () => {
    const ctx = createReducerTestContext();
    expect(validate(ctx, testPoint(), "proximity", null)).toEqual({
      ok: false,
      reason: "discovery_location_required",
    });
  });

  it("rejects commits outside the discovery radius", () => {
    const ctx = createReducerTestContext();
    expect(validate(ctx, testPoint(), "proximity", farAway)).toEqual({
      ok: false,
      reason: "discovery_out_of_range",
    });
  });

  it("uses the point search radius for search zones", () => {
    const ctx = createReducerTestContext();
    const searchZone = testPoint({
      isSearchZone: true,
      searchRadiusMeters: 2_000,
    });
    expect(validate(ctx, searchZone, "proximity", farAway)).toEqual({
      ok: true,
    });
  });

  it("accepts in-range proximity commits for points without authored rules", () => {
    const ctx = createReducerTestContext();
    expect(validate(ctx, testPoint(), "proximity", atPoint)).toEqual({
      ok: true,
    });
  });

  it("rejects observation_lens for points without an observation rule", () => {
    const ctx = createReducerTestContext();
    expect(validate(ctx, testPoint(), "observation_lens", atPoint)).toEqual({
      ok: false,
      reason: "discovery_channel_not_allowed",
    });
  });

  it("rejects proximity commits when rules only allow other channels", () => {
    const ctx = createReducerTestContext();
    const point = testPoint({
      discoveryRules: [{ channel: "qr_scan" }],
    });
    expect(validate(ctx, point, "proximity", atPoint)).toEqual({
      ok: false,
      reason: "discovery_channel_not_allowed",
    });
  });

  it("treats vn_unlock rules as proximity-auto-discoverable (client parity)", () => {
    const ctx = createReducerTestContext();
    const point = testPoint({
      discoveryRules: [{ channel: "vn_unlock" }],
    });
    expect(validate(ctx, point, "proximity", atPoint)).toEqual({ ok: true });
  });

  it("enforces rule conditions server-side", () => {
    const ctx = createReducerTestContext();
    const rules: MapDiscoveryRule[] = [
      {
        channel: "proximity",
        conditions: [{ type: "flag_is", key: "case_started", value: true }],
      },
    ];
    const point = testPoint({ discoveryRules: rules });

    expect(validate(ctx, point, "proximity", atPoint)).toEqual({
      ok: false,
      reason: "discovery_requirements_not_met",
    });

    insertFlag(ctx, "case_started", true);
    expect(validate(ctx, point, "proximity", atPoint)).toEqual({ ok: true });
  });

  it("enforces reveal conditions before any rule matching", () => {
    const ctx = createReducerTestContext();
    const point = testPoint({
      revealConditions: [
        { type: "flag_is", key: "lens_unlocked", value: true },
      ],
    });

    expect(validate(ctx, point, "proximity", atPoint)).toEqual({
      ok: false,
      reason: "discovery_not_revealed",
    });

    insertFlag(ctx, "lens_unlocked", true);
    expect(validate(ctx, point, "proximity", atPoint)).toEqual({ ok: true });
  });

  it("enforces skill gates on observation_lens rules", () => {
    const ctx = createReducerTestContext();
    const point = testPoint({
      discoveryRules: [
        {
          channel: "observation_lens",
          skillGates: [{ skillId: "attr_forensics", rank: "B" }],
        },
      ],
    });

    expect(validate(ctx, point, "observation_lens", atPoint)).toEqual({
      ok: false,
      reason: "discovery_requirements_not_met",
    });

    insertVar(ctx, "skill_xp_attr_forensics", 400);
    expect(validate(ctx, point, "observation_lens", atPoint)).toEqual({
      ok: true,
    });
  });
});
