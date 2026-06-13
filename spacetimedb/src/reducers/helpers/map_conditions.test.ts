import { describe, expect, it, vi } from "vitest";

import {
  createReducerTestContext,
  insertFlag,
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

import {
  createMapEvaluationCache,
  evaluateMapCondition,
  hasGeofenceCondition,
  resolveAttemptLocation,
  resolvePointState,
} from "./map_conditions";
import type { MapCondition, MapPoint } from "./types";

const testPoint = (overrides: Partial<MapPoint> = {}): MapPoint =>
  ({
    id: "point-a",
    title: "Point A",
    regionId: "region-test",
    lat: 47.99,
    lng: 7.85,
    category: "PUBLIC",
    locationId: "loc-a",
    bindings: [],
    ...overrides,
  }) as MapPoint;

const geofence = (radiusMeters: number): MapCondition => ({
  type: "geofence_within",
  lat: 47.99,
  lng: 7.85,
  radiusMeters,
});

describe("map_conditions", () => {
  it("evaluates geofence_within against the attempted location", () => {
    const ctx = createReducerTestContext();
    const cache = createMapEvaluationCache();

    const inside = { attemptedLocation: { lat: 47.9901, lng: 7.8501 } };
    const outside = { attemptedLocation: { lat: 48.05, lng: 7.85 } };

    expect(evaluateMapCondition(ctx, geofence(50), inside, cache)).toBe(true);
    expect(evaluateMapCondition(ctx, geofence(50), outside, cache)).toBe(false);
  });

  it("fails geofence_within when no attempted location is in scope", () => {
    const ctx = createReducerTestContext();
    const cache = createMapEvaluationCache();

    expect(evaluateMapCondition(ctx, geofence(50), {}, cache)).toBe(false);
  });

  it("detects geofence conditions nested in logic combinators", () => {
    expect(
      hasGeofenceCondition({
        type: "logic_and",
        conditions: [
          { type: "flag_is", key: "x", value: true },
          { type: "logic_not", condition: geofence(10) },
        ],
      }),
    ).toBe(true);
    expect(
      hasGeofenceCondition({ type: "flag_is", key: "x", value: true }),
    ).toBe(false);
  });

  it("evaluates point_state_is with a point in scope", () => {
    const ctx = createReducerTestContext();
    const cache = createMapEvaluationCache();
    const point = testPoint();

    expect(
      evaluateMapCondition(
        ctx,
        { type: "point_state_is", state: "locked" },
        { point },
        cache,
      ),
    ).toBe(true);

    insertFlag(ctx, "DISCOVERED_point-a", true);
    expect(resolvePointState(ctx, point)).toBe("discovered");
    expect(
      evaluateMapCondition(
        ctx,
        { type: "point_state_is", state: "discovered" },
        { point },
        cache,
      ),
    ).toBe(true);
  });

  it("reports point_state_is without point scope instead of silently failing", () => {
    const ctx = createReducerTestContext();
    const cache = createMapEvaluationCache();

    expect(
      evaluateMapCondition(
        ctx,
        { type: "point_state_is", state: "locked" },
        {},
        cache,
      ),
    ).toBe(false);

    const telemetry = ctx.db.telemetryEvent.rows();
    expect(telemetry).toHaveLength(1);
    expect(telemetry[0]).toMatchObject({
      eventName: "map_condition_unsupported",
    });
    expect(JSON.parse(telemetry[0].tagsJson)).toMatchObject({
      conditionType: "point_state_is",
      reason: "point_scope_missing",
    });
  });

  it("reports unknown condition types instead of silently failing", () => {
    const ctx = createReducerTestContext();
    const cache = createMapEvaluationCache();
    const driftedCondition = {
      type: "future_condition",
    } as unknown as MapCondition;

    expect(evaluateMapCondition(ctx, driftedCondition, {}, cache)).toBe(false);

    const telemetry = ctx.db.telemetryEvent.rows();
    expect(telemetry).toHaveLength(1);
    expect(JSON.parse(telemetry[0].tagsJson)).toMatchObject({
      conditionType: "future_condition",
      reason: "condition_type_unknown",
    });
  });

  it("combines flags and geofence in one authoritative tree", () => {
    const ctx = createReducerTestContext();
    const cache = createMapEvaluationCache();
    insertFlag(ctx, "case_started", true);

    const condition: MapCondition = {
      type: "logic_and",
      conditions: [
        { type: "flag_is", key: "case_started", value: true },
        geofence(50),
      ],
    };

    expect(
      evaluateMapCondition(
        ctx,
        condition,
        { attemptedLocation: { lat: 47.99, lng: 7.85 } },
        cache,
      ),
    ).toBe(true);
    expect(evaluateMapCondition(ctx, condition, {}, cache)).toBe(false);
  });

  it("normalizes attempted coordinates", () => {
    expect(resolveAttemptLocation(47.99, 7.85)).toEqual({
      lat: 47.99,
      lng: 7.85,
    });
    expect(resolveAttemptLocation(undefined, 7.85)).toBeNull();
    expect(resolveAttemptLocation(Number.NaN, 7.85)).toBeNull();
  });
});
