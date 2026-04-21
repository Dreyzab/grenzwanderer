import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { DbConnection } from "../src/shared/spacetime/bindings";
import {
  ensureAdminAccess,
  getOperatorToken,
  persistOperatorToken,
} from "./spacetime-operator";

const host = process.env.SMOKE_STDB_HOST ?? "ws://127.0.0.1:3000";
const database = process.env.SMOKE_STDB_DB ?? "grezwandererdata";
const mapIterations = Math.max(1, Number(process.env.LAT_MAP_ITERATIONS ?? "60"));
const redeemIterations = Math.max(
  1,
  Number(process.env.LAT_REDEEM_ITERATIONS ?? "60"),
);
const runId = String(Date.now());

const mapPointId = `lat_point_${runId}`;
const mapBindingId = `lat_bind_${runId}`;
const mapLocationId = `loc_lat_${runId}`;

const hashCode = (code: string): string =>
  createHash("sha256").update(code, "utf8").digest("hex");

const qrEntries = Array.from({ length: redeemIterations }, (_, index) => {
  const codeId = `lat_qr_${runId}_${index}`;
  const code = `lat-code-${runId}-${index}`;
  return { codeId, code, codeHash: hashCode(code) };
});

const payload = {
  schemaVersion: 3,
  scenarios: [],
  nodes: [],
  mindPalace: {
    cases: [],
    facts: [],
    hypotheses: [],
  },
  map: {
    defaultRegionId: "FREIBURG_1905",
    regions: [
      {
        id: "FREIBURG_1905",
        name: "Freiburg",
        geoCenterLat: 47.9959,
        geoCenterLng: 7.8522,
        zoom: 14.2,
      },
    ],
    points: [
      {
        id: mapPointId,
        title: "Latency Point",
        regionId: "FREIBURG_1905",
        lat: 47.9959,
        lng: 7.8522,
        category: "HUB",
        locationId: mapLocationId,
        defaultState: "discovered",
        bindings: [
          {
            id: mapBindingId,
            trigger: "card_secondary",
            label: "Travel",
            priority: 10,
            intent: "travel",
            actions: [{ type: "travel_to", locationId: mapLocationId }],
          },
        ],
      },
    ],
    qrCodeRegistry: qrEntries.map((entry) => ({
      codeId: entry.codeId,
      codeHash: entry.codeHash,
      redeemPolicy: "once_per_player",
      contentClass: "evidence_fragment",
      policyTier: "once_per_player",
      effects: [{ type: "unlock_group", groupId: `unlock_${entry.codeId}` }],
    })),
  },
};

const payloadJson = JSON.stringify(payload);
const checksum = createHash("sha256").update(payloadJson, "utf8").digest("hex");

let requestCounter = 0;
const nextRequestId = (suffix: string): string => {
  requestCounter += 1;
  return `latency_map_${runId}_${suffix}_${requestCounter}`;
};

const percentile = (values: number[], ratio: number): number => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio));
  return sorted[idx];
};

const avg = (values: number[]): number =>
  values.length === 0
    ? 0
    : values.reduce((sum, current) => sum + current, 0) / values.length;

const fmt = (value: number): string => value.toFixed(2);

const runBenchmark = async () =>
  new Promise<void>((resolve, reject) => {
    let finished = false;

    const builder = DbConnection.builder()
      .withUri(host)
      .withDatabaseName(database)
      .withToken(getOperatorToken(host, database))
      .onConnect(async (conn, _identity, token) => {
        try {
          persistOperatorToken(host, database, token);
          await ensureAdminAccess(conn);

          await conn.reducers.publishContent({
            requestId: nextRequestId("publish"),
            version: `latency_benchmark_${runId}`,
            checksum,
            schemaVersion: 3,
            payloadJson,
          });

          await new Promise<void>((resolveSync) => {
            conn
              .subscriptionBuilder()
              .onApplied(() => resolveSync())
              .subscribe([
                "SELECT * FROM my_player_location",
                "SELECT * FROM my_redeemed_codes",
                "SELECT * FROM my_unlock_groups",
              ]);
          });

          const mapLatenciesMs: number[] = [];
          for (let index = 0; index < mapIterations; index += 1) {
            const startedAt = performance.now();
            await conn.reducers.mapInteract({
              requestId: nextRequestId(`map_${index}`),
              pointId: mapPointId,
              bindingId: mapBindingId,
              trigger: "card_secondary",
            });
            mapLatenciesMs.push(performance.now() - startedAt);
          }

          const redeemLatenciesMs: number[] = [];
          for (const [index, entry] of qrEntries.entries()) {
            const startedAt = performance.now();
            await conn.reducers.redeemMapCode({
              requestId: nextRequestId(`redeem_${index}`),
              code: entry.code,
              attemptedFromLat: undefined,
              attemptedFromLng: undefined,
            });
            redeemLatenciesMs.push(performance.now() - startedAt);
          }

          const mapStats = {
            count: mapLatenciesMs.length,
            avg: avg(mapLatenciesMs),
            p50: percentile(mapLatenciesMs, 0.5),
            p95: percentile(mapLatenciesMs, 0.95),
            p99: percentile(mapLatenciesMs, 0.99),
          };
          const redeemStats = {
            count: redeemLatenciesMs.length,
            avg: avg(redeemLatenciesMs),
            p50: percentile(redeemLatenciesMs, 0.5),
            p95: percentile(redeemLatenciesMs, 0.95),
            p99: percentile(redeemLatenciesMs, 0.99),
          };

          console.log("Latency benchmark completed.");
          console.log(
            `map_interact  count=${mapStats.count} avg=${fmt(mapStats.avg)}ms p50=${fmt(mapStats.p50)}ms p95=${fmt(mapStats.p95)}ms p99=${fmt(mapStats.p99)}ms`,
          );
          console.log(
            `redeem_map_code count=${redeemStats.count} avg=${fmt(redeemStats.avg)}ms p50=${fmt(redeemStats.p50)}ms p95=${fmt(redeemStats.p95)}ms p99=${fmt(redeemStats.p99)}ms`,
          );

          finished = true;
          conn.disconnect();
          resolve();
        } catch (error) {
          conn.disconnect();
          reject(error);
        }
      })
      .onConnectError((_ctx, error) => {
        reject(error);
      })
      .onDisconnect((_ctx, error) => {
        if (!finished && error) {
          reject(error);
        }
      });

    builder.build();
  });

try {
  await runBenchmark();
} catch (error) {
  console.error("Latency benchmark failed:", error);
  process.exitCode = 1;
}
