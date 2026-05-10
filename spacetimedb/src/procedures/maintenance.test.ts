import { describe, expect, it } from "vitest";

import {
  TELEMETRY_AGGREGATION_DEFAULTS,
  planTelemetryAggregation,
  type TelemetryEventForAggregation,
} from "./telemetryAggregation";

const ONE_MINUTE = 60_000_000n;
const ONE_DAY = 86_400_000_000n;

// Aligned to a minute boundary so `bucketStartOf(NOW) === NOW`.
const NOW = ONE_MINUTE * 25_000_000n;

const event = (
  createdAtMicros: bigint,
  overrides: Partial<TelemetryEventForAggregation> = {},
): TelemetryEventForAggregation => ({
  eventName: "session_started",
  tagsJson: "{}",
  value: undefined,
  createdAt: { microsSinceUnixEpoch: createdAtMicros },
  ...overrides,
});

describe("planTelemetryAggregation", () => {
  it("uses a 15-minute lookback when no checkpoint exists, covering the deploy gap", () => {
    const events = [
      event(NOW - 12n * ONE_MINUTE), // inside lookback window
      event(NOW - 5n * ONE_MINUTE), // inside lookback window
      event(NOW - 30n * ONE_MINUTE), // older than lookback → skip
      event(NOW), // current (active) bucket → skip
    ];

    const plan = planTelemetryAggregation(NOW, events, null);

    expect(plan.fromBucketMicros).toBe(
      NOW - TELEMETRY_AGGREGATION_DEFAULTS.initialLookbackMicros,
    );
    expect(plan.currentBucketStartMicros).toBe(NOW);
    expect(plan.nextCheckpointMicros).toBe(NOW);

    const bucketStarts = plan.aggregates.map((a) => a.bucketStartMicros);
    expect(bucketStarts).toHaveLength(2);
    expect(bucketStarts).toContain(NOW - 12n * ONE_MINUTE);
    expect(bucketStarts).toContain(NOW - 5n * ONE_MINUTE);
  });

  it("defers events in the current (still-receiving) bucket", () => {
    const watermark = NOW - 5n * ONE_MINUTE;
    const events = [
      event(NOW - 3n * ONE_MINUTE), // finalized bucket → aggregate
      event(NOW), // current bucket → skip
      event(NOW + 30n * 1_000_000n), // 30s into current bucket → skip
    ];

    const plan = planTelemetryAggregation(NOW, events, watermark);

    expect(plan.aggregates).toHaveLength(1);
    expect(plan.aggregates[0].bucketStartMicros).toBe(NOW - 3n * ONE_MINUTE);
    expect(plan.nextCheckpointMicros).toBe(NOW);
  });

  it("produces identical plans for repeated runs (retry-after-crash idempotence)", () => {
    const events = [
      event(NOW - 7n * ONE_MINUTE, { value: 5 }),
      event(NOW - 7n * ONE_MINUTE, { value: 3 }), // same key → accumulate
      event(NOW - 4n * ONE_MINUTE, { eventName: "session_ended" }),
    ];

    const planA = planTelemetryAggregation(NOW, events, null);
    const planB = planTelemetryAggregation(NOW, events, null);

    expect(planA.aggregates).toEqual(planB.aggregates);
    expect(planA.fromBucketMicros).toBe(planB.fromBucketMicros);
    expect(planA.nextCheckpointMicros).toBe(planB.nextCheckpointMicros);
  });

  it("accumulates count and sumValue for events sharing a key", () => {
    const watermark = NOW - 5n * ONE_MINUTE;
    const events = [
      event(NOW - 3n * ONE_MINUTE, { value: 1 }),
      event(NOW - 3n * ONE_MINUTE, { value: 2 }),
      event(NOW - 3n * ONE_MINUTE, { value: undefined }), // null/undefined contributes 0
    ];

    const plan = planTelemetryAggregation(NOW, events, watermark);

    expect(plan.aggregates).toHaveLength(1);
    expect(plan.aggregates[0].count).toBe(3n);
    expect(plan.aggregates[0].sumValue).toBe(3);
  });

  it("clamps a stale watermark to the retention cutoff bucket", () => {
    const watermark = NOW - 8n * ONE_DAY; // older than 7-day retention
    const events = [
      event(NOW - 8n * ONE_DAY), // beyond retention → skip
      event(NOW - 3n * ONE_DAY), // within retention → aggregate
    ];

    const plan = planTelemetryAggregation(NOW, events, watermark);

    const retentionCutoffMicros =
      NOW - TELEMETRY_AGGREGATION_DEFAULTS.retentionMicros;
    const expectedFromBucket =
      (retentionCutoffMicros / ONE_MINUTE) * ONE_MINUTE;
    expect(plan.fromBucketMicros).toBe(expectedFromBucket);

    expect(plan.aggregates).toHaveLength(1);
    expect(plan.aggregates[0].bucketStartMicros).toBe(NOW - 3n * ONE_DAY);
  });

  it("returns no aggregates when the watermark is already at the current bucket", () => {
    const watermark = NOW;
    const events = [event(NOW - 2n * ONE_MINUTE), event(NOW)];

    const plan = planTelemetryAggregation(NOW, events, watermark);

    expect(plan.aggregates).toHaveLength(0);
    expect(plan.nextCheckpointMicros).toBe(NOW);
  });
});
