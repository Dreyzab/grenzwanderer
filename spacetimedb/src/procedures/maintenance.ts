import { ScheduleAt, Timestamp } from "spacetimedb";
import type { ReducerExport } from "spacetimedb/server";
import { table, t } from "spacetimedb/server";
import type moduleSchema from "../schema";

const ONE_MINUTE_MICROS = 60_000_000n;
const FIVE_MINUTES_MICROS = 5n * ONE_MINUTE_MICROS;
const FIFTEEN_MINUTES_MICROS = 15n * ONE_MINUTE_MICROS;
const ONE_DAY_MICROS = 86_400_000_000n;
const SEVEN_DAYS_MICROS = 7n * ONE_DAY_MICROS;

type MaintenanceReducer = ReducerExport<any, any>;
type AppSchema = typeof moduleSchema;

let cleanupIdempotencyReducer: MaintenanceReducer | undefined;
let aggregateTelemetryReducer: MaintenanceReducer | undefined;
let cleanupTelemetryReducer: MaintenanceReducer | undefined;

const requireReducer = (
  reducerName: string,
  reducer: MaintenanceReducer | undefined,
): MaintenanceReducer => {
  if (!reducer) {
    throw new Error(
      `Scheduled reducer ${reducerName} is not registered in module exports`,
    );
  }

  return reducer;
};

export const idempotencyCleanupSchedule = table(
  {
    name: "idempotency_cleanup_schedule",
    scheduled: () =>
      requireReducer("cleanup_idempotency_log", cleanupIdempotencyReducer),
  },
  {
    scheduledId: t.u64().primaryKey().autoInc(),
    scheduledAt: t.scheduleAt(),
  },
);

export const telemetryAggregateSchedule = table(
  {
    name: "telemetry_aggregate_schedule",
    scheduled: () =>
      requireReducer("aggregate_telemetry", aggregateTelemetryReducer),
  },
  {
    scheduledId: t.u64().primaryKey().autoInc(),
    scheduledAt: t.scheduleAt(),
  },
);

export const telemetryCleanupSchedule = table(
  {
    name: "telemetry_cleanup_schedule",
    scheduled: () =>
      requireReducer("cleanup_telemetry_event", cleanupTelemetryReducer),
  },
  {
    scheduledId: t.u64().primaryKey().autoInc(),
    scheduledAt: t.scheduleAt(),
  },
);

export const fnv1a = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
};

const scheduleNextIdempotencyCleanup = (ctx: any): void => {
  ctx.db.idempotencyCleanupSchedule.insert({
    scheduledId: 0n,
    scheduledAt: ScheduleAt.time(
      ctx.timestamp.microsSinceUnixEpoch + FIFTEEN_MINUTES_MICROS,
    ),
  });
};

const scheduleNextTelemetryAggregate = (ctx: any): void => {
  ctx.db.telemetryAggregateSchedule.insert({
    scheduledId: 0n,
    scheduledAt: ScheduleAt.time(
      ctx.timestamp.microsSinceUnixEpoch + FIVE_MINUTES_MICROS,
    ),
  });
};

const scheduleNextTelemetryCleanup = (ctx: any): void => {
  ctx.db.telemetryCleanupSchedule.insert({
    scheduledId: 0n,
    scheduledAt: ScheduleAt.time(
      ctx.timestamp.microsSinceUnixEpoch + ONE_DAY_MICROS,
    ),
  });
};

const toBucketStartMicros = (microsSinceUnixEpoch: bigint): bigint =>
  (microsSinceUnixEpoch / ONE_MINUTE_MICROS) * ONE_MINUTE_MICROS;

const buildAggregateKey = (
  bucketStartMicros: bigint,
  eventName: string,
  tagsHash: string,
): string => `${bucketStartMicros.toString()}::${eventName}::${tagsHash}`;

export let cleanup_idempotency_log: MaintenanceReducer;
export let aggregate_telemetry: MaintenanceReducer;
export let cleanup_telemetry_event: MaintenanceReducer;

export const register_maintenance_reducers = (spacetimedb: AppSchema): void => {
  if (!cleanupIdempotencyReducer) {
    cleanupIdempotencyReducer = spacetimedb.reducer(
      { arg: idempotencyCleanupSchedule.rowType },
      (ctx, { arg }) => {
        const _scheduledId = arg.scheduledId;
        void _scheduledId;

        const nowMicros = ctx.timestamp.microsSinceUnixEpoch;
        const expiredKeys: string[] = [];

        for (const row of ctx.db.idempotencyLog.iter()) {
          if (row.expiresAt.microsSinceUnixEpoch <= nowMicros) {
            expiredKeys.push(row.idempotencyKey);
          }
        }

        for (const key of expiredKeys) {
          ctx.db.idempotencyLog.idempotencyKey.delete(key);
        }

        scheduleNextIdempotencyCleanup(ctx);
      },
    );
    cleanup_idempotency_log = cleanupIdempotencyReducer;
  }

  if (!aggregateTelemetryReducer) {
    aggregateTelemetryReducer = spacetimedb.reducer(
      { arg: telemetryAggregateSchedule.rowType },
      (ctx, { arg }) => {
        const _scheduledId = arg.scheduledId;
        void _scheduledId;

        const nowMicros = ctx.timestamp.microsSinceUnixEpoch;
        const cutoffMicros = nowMicros - SEVEN_DAYS_MICROS;

        const aggregateMap = new Map<
          string,
          {
            bucketStartMicros: bigint;
            eventName: string;
            tagsHash: string;
            count: bigint;
            sumValue: number;
          }
        >();

        for (const event of ctx.db.telemetryEvent.iter()) {
          if (event.createdAt.microsSinceUnixEpoch < cutoffMicros) {
            continue;
          }

          const bucketStartMicros = toBucketStartMicros(
            event.createdAt.microsSinceUnixEpoch,
          );
          const tagsHash = fnv1a(event.tagsJson);
          const aggregateKey = buildAggregateKey(
            bucketStartMicros,
            event.eventName,
            tagsHash,
          );

          const existing = aggregateMap.get(aggregateKey);
          if (existing) {
            existing.count += 1n;
            existing.sumValue += event.value ?? 0;
            continue;
          }

          aggregateMap.set(aggregateKey, {
            bucketStartMicros,
            eventName: event.eventName,
            tagsHash,
            count: 1n,
            sumValue: event.value ?? 0,
          });
        }

        for (const [aggregateKey, aggregate] of aggregateMap.entries()) {
          const row = {
            aggregateKey,
            bucketStart: new Timestamp(aggregate.bucketStartMicros),
            eventName: aggregate.eventName,
            tagsHash: aggregate.tagsHash,
            count: aggregate.count,
            sumValue: aggregate.sumValue,
            updatedAt: ctx.timestamp,
          };

          const existing =
            ctx.db.telemetryAggregate.aggregateKey.find(aggregateKey);
          if (existing) {
            ctx.db.telemetryAggregate.aggregateKey.update({
              ...existing,
              ...row,
            });
          } else {
            ctx.db.telemetryAggregate.insert(row);
          }
        }

        const staleAggregateRows: string[] = [];
        for (const aggregate of ctx.db.telemetryAggregate.iter()) {
          if (aggregate.bucketStart.microsSinceUnixEpoch < cutoffMicros) {
            staleAggregateRows.push(aggregate.aggregateKey);
          }
        }

        for (const key of staleAggregateRows) {
          ctx.db.telemetryAggregate.aggregateKey.delete(key);
        }

        scheduleNextTelemetryAggregate(ctx);
      },
    );
    aggregate_telemetry = aggregateTelemetryReducer;
  }

  if (!cleanupTelemetryReducer) {
    cleanupTelemetryReducer = spacetimedb.reducer(
      { arg: telemetryCleanupSchedule.rowType },
      (ctx, { arg }) => {
        const _scheduledId = arg.scheduledId;
        void _scheduledId;

        const cutoffMicros =
          ctx.timestamp.microsSinceUnixEpoch - SEVEN_DAYS_MICROS;
        const staleIds: bigint[] = [];

        for (const event of ctx.db.telemetryEvent.iter()) {
          if (event.createdAt.microsSinceUnixEpoch < cutoffMicros) {
            staleIds.push(event.eventId);
          }
        }

        for (const eventId of staleIds) {
          ctx.db.telemetryEvent.eventId.delete(eventId);
        }

        scheduleNextTelemetryCleanup(ctx);
      },
    );
    cleanup_telemetry_event = cleanupTelemetryReducer;
  }
};

export const seed_maintenance_schedules = (ctx: any): void => {
  if (ctx.db.idempotencyCleanupSchedule.count() === 0n) {
    scheduleNextIdempotencyCleanup(ctx);
  }

  if (ctx.db.telemetryAggregateSchedule.count() === 0n) {
    scheduleNextTelemetryAggregate(ctx);
  }

  if (ctx.db.telemetryCleanupSchedule.count() === 0n) {
    scheduleNextTelemetryCleanup(ctx);
  }
};

export {
  FIFTEEN_MINUTES_MICROS,
  FIVE_MINUTES_MICROS,
  ONE_DAY_MICROS,
  ONE_MINUTE_MICROS,
  SEVEN_DAYS_MICROS,
};
