/**
 * Pure telemetry-aggregation helpers used by `aggregate_telemetry` in
 * `maintenance.ts`. Kept free of any `spacetimedb` runtime imports so the
 * planner can be unit-tested against in-memory event arrays.
 */

const ONE_MINUTE_MICROS = 60_000_000n;
const FIFTEEN_MINUTES_MICROS = 15n * ONE_MINUTE_MICROS;
const ONE_DAY_MICROS = 86_400_000_000n;
const SEVEN_DAYS_MICROS = 7n * ONE_DAY_MICROS;

export const fnv1a = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const buildAggregateKey = (
  bucketStartMicros: bigint,
  eventName: string,
  tagsHash: string,
): string => `${bucketStartMicros.toString()}::${eventName}::${tagsHash}`;

export interface TelemetryEventForAggregation {
  eventName: string;
  tagsJson: string;
  value: number | null | undefined;
  createdAt: { microsSinceUnixEpoch: bigint };
}

export interface TelemetryAggregateAccumulation {
  aggregateKey: string;
  bucketStartMicros: bigint;
  eventName: string;
  tagsHash: string;
  count: bigint;
  sumValue: number;
}

export interface TelemetryAggregationConfig {
  retentionMicros: bigint;
  initialLookbackMicros: bigint;
  bucketWidthMicros: bigint;
}

export const TELEMETRY_AGGREGATION_DEFAULTS: TelemetryAggregationConfig = {
  retentionMicros: SEVEN_DAYS_MICROS,
  initialLookbackMicros: FIFTEEN_MINUTES_MICROS,
  bucketWidthMicros: ONE_MINUTE_MICROS,
};

export interface TelemetryAggregationPlan {
  fromBucketMicros: bigint;
  currentBucketStartMicros: bigint;
  aggregates: TelemetryAggregateAccumulation[];
  nextCheckpointMicros: bigint;
}

/**
 * Pure aggregation planner. Decides which buckets to upsert and where to
 * advance the watermark, given a snapshot of telemetry events.
 *
 * Semantics:
 *  - Aggregates events whose `createdAt` falls in
 *    `[fromBucketMicros, currentBucketStartMicros)`.
 *  - `existingWatermarkMicros == null` (first run after deploy) initializes
 *    the floor at `currentBucketStart - initialLookback` so the deploy gap
 *    is not silently dropped. Buckets that overlap with the previous
 *    reducer's coverage are recomputed from the same events and produce the
 *    same aggregate values, which is idempotent against the upsert in the
 *    caller.
 *  - If the watermark has fallen behind the retention horizon (e.g. module
 *    paused for a week), the floor is advanced to the retention cutoff
 *    bucket; events past retention are not aggregated and will be dropped
 *    by `cleanup_telemetry_event`.
 *  - `nextCheckpointMicros` is `currentBucketStart`, not `nowMicros`, so the
 *    active bucket keeps receiving events between runs and is finalized
 *    only on the next invocation.
 */
export const planTelemetryAggregation = (
  nowMicros: bigint,
  events: Iterable<TelemetryEventForAggregation>,
  existingWatermarkMicros: bigint | null,
  config: TelemetryAggregationConfig = TELEMETRY_AGGREGATION_DEFAULTS,
): TelemetryAggregationPlan => {
  const bucketStartOf = (microsSinceUnixEpoch: bigint): bigint =>
    (microsSinceUnixEpoch / config.bucketWidthMicros) *
    config.bucketWidthMicros;

  const currentBucketStartMicros = bucketStartOf(nowMicros);
  const retentionCutoffMicros = nowMicros - config.retentionMicros;

  const checkpointMicros =
    existingWatermarkMicros ??
    currentBucketStartMicros - config.initialLookbackMicros;

  const fromBucketMicros =
    checkpointMicros < retentionCutoffMicros
      ? bucketStartOf(retentionCutoffMicros)
      : checkpointMicros;

  const aggregateMap = new Map<string, TelemetryAggregateAccumulation>();

  if (fromBucketMicros < currentBucketStartMicros) {
    for (const event of events) {
      const created = event.createdAt.microsSinceUnixEpoch;
      if (created < fromBucketMicros) {
        continue;
      }
      if (created >= currentBucketStartMicros) {
        continue;
      }

      const bucketStartMicros = bucketStartOf(created);
      const tagsHash = fnv1a(event.tagsJson);
      const aggregateKey = buildAggregateKey(
        bucketStartMicros,
        event.eventName,
        tagsHash,
      );
      const eventValue = event.value ?? 0;

      const existing = aggregateMap.get(aggregateKey);
      if (existing) {
        existing.count += 1n;
        existing.sumValue += eventValue;
        continue;
      }

      aggregateMap.set(aggregateKey, {
        aggregateKey,
        bucketStartMicros,
        eventName: event.eventName,
        tagsHash,
        count: 1n,
        sumValue: eventValue,
      });
    }
  }

  return {
    fromBucketMicros,
    currentBucketStartMicros,
    aggregates: [...aggregateMap.values()],
    nextCheckpointMicros: currentBucketStartMicros,
  };
};
