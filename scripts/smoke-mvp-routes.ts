import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DbConnection } from "../src/module_bindings";

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
  scenarios?: Array<{ id: string }>;
  nodes?: Array<{
    id: string;
    scenarioId: string;
    choices: Array<{ id: string }>;
  }>;
};
const schemaVersion = parsedPayload.schemaVersion;
if (typeof schemaVersion !== "number") {
  throw new Error("pilot.snapshot.json is missing schemaVersion");
}
if (
  !Array.isArray(parsedPayload.scenarios) ||
  !Array.isArray(parsedPayload.nodes)
) {
  throw new Error("pilot.snapshot.json has invalid scenarios/nodes shape");
}

const checksum = createHash("sha256").update(payloadJson, "utf8").digest("hex");
const scenarioIds = new Set(parsedPayload.scenarios.map((entry) => entry.id));
const nodeById = new Map(parsedPayload.nodes.map((entry) => [entry.id, entry]));

let requestCounter = 0;
const nextRequestId = (suffix: string): string => {
  requestCounter += 1;
  return `smoke_mvp_routes_${runId}_${suffix}_${requestCounter}`;
};

const asNumber = (value: number | bigint): number =>
  typeof value === "bigint" ? Number(value) : value;

const wait = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const resolveChoiceId = (nodeId: string, preferredChoiceId: string): string => {
  const node = nodeById.get(nodeId);
  if (!node) {
    throw new Error(`Node ${nodeId} is missing in snapshot`);
  }

  if (node.choices.some((choice) => choice.id === preferredChoiceId)) {
    return preferredChoiceId;
  }
  if (node.choices.length === 1) {
    return node.choices[0].id;
  }

  throw new Error(
    `Choice ${preferredChoiceId} is missing for node ${nodeId}; available: ${node.choices.map((choice) => choice.id).join(", ")}`,
  );
};

const startScenarioWithRetry = async (
  conn: DbConnection,
  scenarioId: string,
): Promise<void> => {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      await conn.reducers.startScenario({
        requestId: nextRequestId(`start_${scenarioId}`),
        scenarioId,
      });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Unknown scenario") && attempt < 20) {
        await wait(250);
        continue;
      }
      throw error;
    }
  }
};

const runScenarioPath = async (
  conn: DbConnection,
  scenarioId: string,
  steps: ReadonlyArray<{ nodeId: string; choiceId: string }>,
): Promise<void> => {
  if (!scenarioIds.has(scenarioId)) {
    throw new Error(`Scenario ${scenarioId} is missing in snapshot`);
  }
  await startScenarioWithRetry(conn, scenarioId);

  for (const step of steps) {
    const choiceId = resolveChoiceId(step.nodeId, step.choiceId);
    await conn.reducers.recordChoice({
      requestId: nextRequestId(`choice_${scenarioId}`),
      scenarioId,
      choiceId,
    });
  }
};

const assertQuestStageAtLeast = (
  conn: DbConnection,
  playerHex: string,
  questId: string,
  minStage: number,
): void => {
  const row = [...conn.db.playerQuest.iter()].find(
    (entry) =>
      entry.playerId.toHexString() === playerHex && entry.questId === questId,
  );

  const stage = row ? asNumber(row.stage) : 0;
  if (stage < minStage) {
    throw new Error(
      `Quest ${questId} stage is ${stage}; expected >= ${minStage}`,
    );
  }
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
      .onConnect(async (conn) => {
        try {
          const identity = conn.identity;
          if (!identity) {
            throw new Error("Missing connection identity");
          }

          await conn.reducers.publishContent({
            requestId: nextRequestId("publish"),
            version: `smoke_mvp_routes_${runId}`,
            checksum,
            schemaVersion,
            payloadJson,
          });

          await new Promise<void>((resolveSync) => {
            conn
              .subscriptionBuilder()
              .onApplied(() => resolveSync())
              .subscribe([
                "SELECT * FROM player_quest",
                "SELECT * FROM player_flag",
                "SELECT * FROM vn_session",
              ]);
          });

          await runScenarioPath(conn, "sandbox_banker_pilot", [
            { nodeId: "scene_bank_intro", choiceId: "BANK_INTRO_ACCEPT" },
            { nodeId: "scene_bank_intro_ch1", choiceId: "BANK_CH1_CONTINUE" },
            { nodeId: "scene_bank_leads", choiceId: "BANK_LEAD_HOUSE" },
            { nodeId: "scene_bank_leads", choiceId: "BANK_LEAD_CASINO" },
          ]);

          await runScenarioPath(conn, "sandbox_dog_pilot", [
            { nodeId: "scene_dog_briefing", choiceId: "DOG_BRIEFING_CONTINUE" },
            { nodeId: "scene_dog_leads", choiceId: "DOG_LEAD_MARKET" },
            {
              nodeId: "scene_dog_market_encounter",
              choiceId: "DOG_MARKET_QUIET_NOTE",
            },
            { nodeId: "scene_dog_leads", choiceId: "DOG_LEAD_STATION" },
            {
              nodeId: "scene_dog_station_encounter",
              choiceId: "DOG_STATION_INTERVIEW",
            },
            { nodeId: "scene_dog_leads", choiceId: "DOG_LEAD_UNI" },
            {
              nodeId: "scene_dog_uni_encounter",
              choiceId: "DOG_UNI_ARCHIVE_REQUEST",
            },
            { nodeId: "scene_dog_leads", choiceId: "DOG_LEAD_REUNION" },
            {
              nodeId: "scene_park_reunion_beat1",
              choiceId: "DOG_REUNION_CONTINUE",
            },
          ]);

          await runScenarioPath(conn, "sandbox_ghost_pilot", [
            { nodeId: "scene_estate_intro", choiceId: "GHOST_INVESTIGATE" },
            {
              nodeId: "scene_estate_intro_beat1",
              choiceId: "GHOST_BEAT1_CONTINUE",
            },
            {
              nodeId: "scene_guild_tutorial",
              choiceId: "GHOST_TUTORIAL_CONTINUE",
            },
            {
              nodeId: "scene_guild_tutorial_beat1",
              choiceId: "GHOST_TUTORIAL_INVESTIGATE",
            },
            {
              nodeId: "scene_evidence_collection",
              choiceId: "GHOST_EVIDENCE_BOOKSHELF",
            },
            {
              nodeId: "scene_evidence_collection_beat1",
              choiceId: "GHOST_COLLECT_MORE",
            },
            {
              nodeId: "scene_evidence_collection",
              choiceId: "GHOST_EVIDENCE_FLOOR",
            },
            {
              nodeId: "scene_evidence_collection_beat1",
              choiceId: "GHOST_CONCLUSION_TRUE",
            },
          ]);

          const playerHex = identity.toHexString();
          assertQuestStageAtLeast(conn, playerHex, "quest_banker", 3);
          assertQuestStageAtLeast(conn, playerHex, "quest_dog", 3);
          assertQuestStageAtLeast(conn, playerHex, "quest_ghost", 3);

          assertFlagTrue(conn, playerHex, "dog_case_closed");
          assertFlagTrue(conn, playerHex, "ghost_case_closed");
          assertFlagTrue(conn, playerHex, "ghost_truth_proven");

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
  console.log("MVP routes smoke script passed.");
} catch (error) {
  console.error("MVP routes smoke script failed:", error);
  process.exitCode = 1;
}
