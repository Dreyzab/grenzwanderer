import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DbConnection } from "../src/module_bindings";
import {
  ensureAdminAccess,
  getOperatorToken,
  persistOperatorToken,
} from "./spacetime-operator";

const host = process.env.SMOKE_STDB_HOST ?? "ws://127.0.0.1:3000";
const database = process.env.SMOKE_STDB_DB ?? "grezwandererdata";
const runId = String(Date.now());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const snapshotPath = path.join(
  repoRoot,
  "content",
  "vn",
  "pilot.snapshot.json",
);

const payloadJson = readFileSync(snapshotPath, "utf8");
const parsedPayload = JSON.parse(payloadJson) as {
  schemaVersion?: number;
};

const schemaVersion = parsedPayload.schemaVersion;
if (typeof schemaVersion !== "number") {
  throw new Error("pilot.snapshot.json is missing schemaVersion");
}

const checksum = createHash("sha256").update(payloadJson, "utf8").digest("hex");

let requestCounter = 0;
const nextRequestId = (suffix: string): string => {
  requestCounter += 1;
  return `smoke_dog_deduction_${runId}_${suffix}_${requestCounter}`;
};

const assertFlagTrue = (
  conn: DbConnection,
  playerHex: string,
  key: string,
): void => {
  const row = [...conn.db.playerFlag.iter()].find(
    (entry) => entry.playerId.toHexString() === playerHex && entry.key === key,
  );

  if (!row || !row.value) {
    throw new Error(`Flag ${key} is not set to true`);
  }
};

const runSmoke = async () =>
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
          const identity = conn.identity;
          if (!identity) {
            throw new Error("Missing connection identity");
          }

          // 1. Publish snapshot to DB so hypotheses are known
          await conn.reducers.publishContent({
            requestId: nextRequestId("publish"),
            version: `smoke_dog_deduction_${runId}`,
            checksum,
            schemaVersion,
            payloadJson,
          });

          await new Promise<void>((resolveSync) => {
            conn
              .subscriptionBuilder()
              .onApplied(() => resolveSync())
              .subscribe([
                "SELECT * FROM player_flag",
                "SELECT * FROM player_mind_fact",
                "SELECT * FROM player_mind_hypothesis",
              ]);
          });

          const playerHex = identity.toHexString();

          // 2. Start the case explicitly
          await conn.reducers.startMindCase({
            requestId: nextRequestId("start_case"),
            caseId: "case_dog_trail",
          });

          // 3. Discover route facts
          for (const factId of [
            "fact_dog_market_route",
            "fact_dog_station_manifest",
            "fact_dog_uni_registry",
          ]) {
            await conn.reducers.discoverFact({
              requestId: nextRequestId(`discover_${factId}`),
              caseId: "case_dog_trail",
              factId,
            });
          }

          // 4. Validate route hypothesis
          await conn.reducers.validateHypothesis({
            requestId: nextRequestId("validate_route"),
            caseId: "case_dog_trail",
            hypothesisId: "hyp_dog_route_reconstruction",
          });

          // 5. Discover handler facts
          for (const factId of [
            "fact_dog_tailor_invoice",
            "fact_dog_pub_identification",
            "fact_dog_reunion_capstone",
          ]) {
            await conn.reducers.discoverFact({
              requestId: nextRequestId(`discover_${factId}`),
              caseId: "case_dog_trail",
              factId,
            });
          }

          // 6. Set required variable for handler hypothesis (dog_case_confidence >= 0.5)
          // Since we skipped the VN scenes with `add_var`, we set it manually.
          await conn.reducers.setVar({
            key: "dog_case_confidence",
            floatValue: 0.8,
          });

          // 7. Validate handler hypothesis
          await conn.reducers.validateHypothesis({
            requestId: nextRequestId("validate_handler"),
            caseId: "case_dog_trail",
            hypothesisId: "hyp_dog_handler_exposed",
          });

          // 8. Assertions
          assertFlagTrue(conn, playerHex, "dog_route_proven");
          assertFlagTrue(conn, playerHex, "dog_handler_proven");

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
  console.log("Dog Deduction smoke script passed.");
} catch (error) {
  console.error("Dog Deduction smoke script failed:", error);
  process.exitCode = 1;
}
