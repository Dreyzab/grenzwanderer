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
const DEFAULT_TRACK_BY_PROFILE: Record<string, string> = {
  journalist: "journalist_whistleblower",
  aristocrat: "aristocrat_duelist",
  veteran: "veteran_shield",
  archivist: "archivist_dust_cartographer",
};

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

const beginOriginDeterministically = async (
  conn: DbConnection,
  requestId: string,
  profileId: string,
): Promise<void> => {
  const selectedTrackId = DEFAULT_TRACK_BY_PROFILE[profileId];
  if (!selectedTrackId) {
    throw new Error(`Missing default selectedTrackId for profile ${profileId}`);
  }

  try {
    await conn.reducers.beginFreiburgOrigin({
      requestId,
      profileId,
      selectedTrackId,
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
      selectedTrackId,
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
            `smoke_origin_entry_${suffix}_${runId}`;
          const playerHex = conn.identity?.toHexString();
          if (!playerHex) {
            throw new Error(
              "Smoke connection did not expose a player identity",
            );
          }

          await conn.reducers.publishContent({
            requestId: request("publish"),
            version: `smoke_origin_entry_${runId}`,
            checksum: snapshot.checksum,
            schemaVersion: snapshot.schemaVersion,
            payloadJson: snapshot.payloadJson,
          });

          await new Promise<void>((resolveSync) => {
            conn
              .subscriptionBuilder()
              .onApplied(() => resolveSync())
              .subscribe([
                "SELECT * FROM content_version",
                "SELECT * FROM content_snapshot",
                "SELECT * FROM my_vn_sessions",
                "SELECT * FROM my_player_flags",
              ]);
          });

          await beginOriginDeterministically(
            conn,
            request("journalist"),
            "journalist",
          );

          const journalistSessions = [...conn.db.vnSession.iter()].filter(
            (row) => row.playerId.toHexString() === playerHex,
          );
          if (
            journalistSessions.length !== 1 ||
            journalistSessions[0].scenarioId !== "intro_journalist"
          ) {
            throw new Error(
              `Expected single intro_journalist session, got ${JSON.stringify(
                journalistSessions.map((row) => ({
                  scenarioId: row.scenarioId,
                  nodeId: row.nodeId,
                })),
              )}`,
            );
          }

          const journalistFlags = [...conn.db.playerFlag.iter()].filter(
            (row) => row.playerId.toHexString() === playerHex,
          );
          if (
            !journalistFlags.some(
              (row) => row.key === "origin_journalist" && row.value,
            )
          ) {
            throw new Error(
              "Expected journalist origin flag after begin reducer",
            );
          }

          await expectRejected(
            () =>
              conn.reducers.beginFreiburgOrigin({
                requestId: request("aristocrat_without_reset"),
                profileId: "aristocrat",
                selectedTrackId: "aristocrat_duelist",
                resetProgress: false,
              }),
            "Existing Freiburg progress requires resetProgress=true",
          );

          await conn.reducers.beginFreiburgOrigin({
            requestId: request("aristocrat_with_reset"),
            profileId: "aristocrat",
            selectedTrackId: "aristocrat_duelist",
            resetProgress: true,
          });

          const finalSessions = [...conn.db.vnSession.iter()].filter(
            (row) => row.playerId.toHexString() === playerHex,
          );
          if (
            finalSessions.length !== 1 ||
            finalSessions[0].scenarioId !== "intro_aristocrat"
          ) {
            throw new Error(
              `Expected single intro_aristocrat session after reset, got ${JSON.stringify(
                finalSessions.map((row) => ({
                  scenarioId: row.scenarioId,
                  nodeId: row.nodeId,
                })),
              )}`,
            );
          }

          const finalFlags = [...conn.db.playerFlag.iter()].filter(
            (row) => row.playerId.toHexString() === playerHex,
          );
          const hasAristocratFlag = finalFlags.some(
            (row) => row.key === "origin_aristocrat" && row.value,
          );
          const hasJournalistFlag = finalFlags.some(
            (row) => row.key === "origin_journalist" && row.value,
          );
          if (!hasAristocratFlag || hasJournalistFlag) {
            throw new Error(
              "Expected reset path to clear journalist state and apply aristocrat state",
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
