import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DbConnection } from "../src/shared/spacetime/bindings";
import {
  ensureAdminAccess,
  getOperatorToken,
  persistOperatorToken,
} from "./spacetime-operator";

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

const beginOriginDeterministically = async (
  conn: DbConnection,
  requestId: string,
  profileId: string,
): Promise<void> => {
  try {
    await conn.reducers.beginFreiburgOrigin({
      requestId,
      profileId,
      resetProgress: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      !message.includes(
        "Existing Freiburg progress requires resetProgress=true",
      )
    ) {
      throw error;
    }

    await conn.reducers.beginFreiburgOrigin({
      requestId: `${requestId}_reset`,
      profileId,
      resetProgress: true,
    });
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
          const snapshot = loadSnapshot();
          const runId = Date.now();
          const request = (suffix: string) =>
            `smoke_origin_handoff_${suffix}_${runId}`;
          const playerHex = conn.identity?.toHexString();
          if (!playerHex) {
            throw new Error(
              "Smoke connection did not expose a player identity",
            );
          }

          await conn.reducers.publishContent({
            requestId: request("publish"),
            version: `smoke_origin_handoff_${runId}`,
            checksum: snapshot.checksum,
            schemaVersion: snapshot.schemaVersion,
            payloadJson: snapshot.payloadJson,
          });

          await conn.reducers.setFlag({
            key: "met_anna_intro",
            value: false,
          });
          await conn.reducers.setFlag({
            key: "origin_journalist_handoff_done",
            value: false,
          });
          await conn.reducers.setFlag({
            key: "agency_briefing_complete",
            value: false,
          });

          let blockedBriefingStart = false;
          try {
            await conn.reducers.startScenario({
              requestId: request("briefing_before_wakeup"),
              scenarioId: "sandbox_agency_briefing",
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            blockedBriefingStart = message.includes(
              "Scenario start is blocked by completion route rules",
            );
          }

          if (!blockedBriefingStart) {
            throw new Error(
              "Expected sandbox_agency_briefing to be blocked before journalist wakeup completion",
            );
          }

          await beginOriginDeterministically(
            conn,
            request("journalist"),
            "journalist",
          );

          await conn.reducers.recordChoice({
            requestId: request("wake_surface"),
            scenarioId: "journalist_agency_wakeup",
            choiceId: "JOURNALIST_WAKEUP_SURFACE",
          });
          await conn.reducers.recordChoice({
            requestId: request("wake_orient"),
            scenarioId: "journalist_agency_wakeup",
            choiceId: "JOURNALIST_WAKEUP_ORIENT",
          });

          const flags = [...conn.db.playerFlag.iter()].filter(
            (row) => row.playerId.toHexString() === playerHex,
          );
          const hasHandoffFlag = flags.some(
            (row) => row.key === "origin_journalist_handoff_done" && row.value,
          );
          const annaIntroSet = flags.some(
            (row) => row.key === "met_anna_intro" && row.value,
          );
          if (!hasHandoffFlag) {
            throw new Error(
              "Expected origin_journalist_handoff_done after wakeup completion",
            );
          }
          if (annaIntroSet) {
            throw new Error(
              "Expected met_anna_intro to remain false after wakeup completion",
            );
          }

          await conn.reducers.startScenario({
            requestId: request("briefing_after_wakeup"),
            scenarioId: "sandbox_agency_briefing",
          });

          const sessions = [...conn.db.vnSession.iter()].filter(
            (row) => row.playerId.toHexString() === playerHex,
          );
          const briefingSession = sessions.find(
            (row) => row.scenarioId === "sandbox_agency_briefing",
          );
          if (!briefingSession) {
            throw new Error(
              "Expected sandbox_agency_briefing session after wakeup handoff",
            );
          }

          let blockedWakeupRestart = false;
          try {
            await conn.reducers.startScenario({
              requestId: request("wakeup_restart"),
              scenarioId: "journalist_agency_wakeup",
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            blockedWakeupRestart = message.includes(
              "Scenario start is blocked by completion route rules",
            );
          }

          if (!blockedWakeupRestart) {
            throw new Error(
              "Expected journalist_agency_wakeup to be blocked after canonical handoff",
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
  console.log("Origin handoff smoke script passed.");
} catch (error) {
  console.error("Origin handoff smoke script failed:", error);
  process.exitCode = 1;
}
