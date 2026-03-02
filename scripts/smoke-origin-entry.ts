import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DbConnection } from "../src/module_bindings";

const host = process.env.SMOKE_STDB_HOST ?? "ws://127.0.0.1:3000";
const database = process.env.SMOKE_STDB_DB ?? "grezwandererdata";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const snapshotPath = path.join(
  repoRoot,
  "content",
  "vn",
  "pilot.snapshot.json",
);

type SnapshotPayload = {
  checksum: string;
  schemaVersion: number;
};

const loadSnapshot = (): {
  checksum: string;
  schemaVersion: number;
  payloadJson: string;
} => {
  const raw = readFileSync(snapshotPath, "utf8");
  const parsed = JSON.parse(raw) as SnapshotPayload;
  return {
    checksum: parsed.checksum,
    schemaVersion: parsed.schemaVersion,
    payloadJson: raw,
  };
};

const expectRejected = async (
  action: () => Promise<unknown>,
  expectedMessagePart: string,
): Promise<void> => {
  let rejected = false;
  try {
    await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes(expectedMessagePart)) {
      throw new Error(
        `Expected error containing "${expectedMessagePart}" but got "${message}"`,
      );
    }
    rejected = true;
  }

  if (!rejected) {
    throw new Error(`Expected reducer to reject with "${expectedMessagePart}"`);
  }
};

const getMaxTelemetryEventId = (conn: DbConnection): bigint =>
  [...conn.db.telemetryEvent.iter()].reduce(
    (max, row) => (row.eventId > max ? row.eventId : max),
    -1n,
  );

const runSmoke = async () =>
  new Promise<void>((resolve, reject) => {
    let finished = false;

    const builder = DbConnection.builder()
      .withUri(host)
      .withDatabaseName(database)
      .onConnect(async (conn) => {
        try {
          const snapshot = loadSnapshot();
          const runId = Date.now();
          const request = (suffix: string) =>
            `smoke_origin_entry_${suffix}_${runId}`;

          await conn.reducers.publishContent({
            requestId: request("publish"),
            version: `smoke_origin_entry_${runId}`,
            checksum: snapshot.checksum,
            schemaVersion: snapshot.schemaVersion,
            payloadJson: snapshot.payloadJson,
          });

          // Keep the run deterministic on local shared DB.
          await conn.reducers.setFlag({
            key: "origin_journalist",
            value: false,
          });
          await conn.reducers.setFlag({
            key: "char_creation_complete",
            value: false,
          });
          await conn.reducers.setFlag({ key: "met_anna_intro", value: false });
          await conn.reducers.setFlag({
            key: "origin_journalist_handoff_done",
            value: false,
          });

          await new Promise<void>((resolveSync) => {
            conn
              .subscriptionBuilder()
              .onApplied(() => resolveSync())
              .subscribe([
                "SELECT * FROM content_version",
                "SELECT * FROM content_snapshot",
                "SELECT * FROM vn_session",
                "SELECT * FROM telemetry_event",
              ]);
          });

          const beforeTelemetryEventId = getMaxTelemetryEventId(conn);

          await conn.reducers.startScenario({
            requestId: request("start_bootstrap"),
            scenarioId: "origin_journalist_bootstrap",
          });

          await expectRejected(
            () =>
              conn.reducers.startScenario({
                requestId: request("start_bootstrap_again"),
                scenarioId: "origin_journalist_bootstrap",
              }),
            "Scenario start node preconditions are not satisfied",
          );

          await conn.reducers.startScenario({
            requestId: request("start_intro"),
            scenarioId: "intro_journalist",
          });

          const nextEvents = [...conn.db.telemetryEvent.iter()].filter(
            (row) => row.eventId > beforeTelemetryEventId,
          );
          const taggedBootstrapStart = nextEvents.find(
            (row) =>
              row.eventName === "scenario_started" &&
              row.tagsJson.includes(
                '"scenarioId":"origin_journalist_bootstrap"',
              ) &&
              row.tagsJson.includes('"systemFlow":"origin_bootstrap"'),
          );

          if (!taggedBootstrapStart) {
            console.log(
              "All vn sessions:",
              [...conn.db.vnSession.iter()].map((r) => ({
                scenarioId: r.scenarioId,
                nodeId: r.nodeId,
              })),
            );
            console.log(
              "All telemetry events:",
              [...conn.db.telemetryEvent.iter()].map((r) => ({
                eventId: String(r.eventId),
                eventName: r.eventName,
                tagsJson: r.tagsJson,
              })),
            );
            throw new Error(
              "Expected bootstrap scenario_started telemetry with systemFlow=origin_bootstrap",
            );
          }

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
  await runSmoke();
  console.log("Origin entry smoke script passed.");
} catch (error) {
  console.error("Origin entry smoke script failed:", error);
  process.exitCode = 1;
}
