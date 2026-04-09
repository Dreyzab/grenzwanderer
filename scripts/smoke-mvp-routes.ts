import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DbConnection } from "../src/shared/spacetime/bindings";
import {
  closeBattleIfOpen,
  getCurrentBattleSession,
  playOutBattle,
} from "./battle-smoke-helpers";
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

type ScenarioStep = {
  nodeId: string;
  choiceId: string;
  passiveChecks?: string[];
  activeChecks?: string[];
};

const runScenarioPath = async (
  conn: DbConnection,
  scenarioId: string,
  steps: ReadonlyArray<ScenarioStep>,
): Promise<void> => {
  if (!scenarioIds.has(scenarioId)) {
    throw new Error(`Scenario ${scenarioId} is missing in snapshot`);
  }
  await startScenarioWithRetry(conn, scenarioId);

  for (const step of steps) {
    if (step.passiveChecks) {
      for (const checkId of step.passiveChecks) {
        await conn.reducers.performSkillCheck({
          requestId: nextRequestId(`check_${scenarioId}_${checkId}`),
          scenarioId,
          checkId,
          fortuneSpend: undefined,
        });
      }
    }
    if (step.activeChecks) {
      for (const checkId of step.activeChecks) {
        await conn.reducers.performSkillCheck({
          requestId: nextRequestId(`active_check_${scenarioId}_${checkId}`),
          scenarioId,
          checkId,
          fortuneSpend: undefined,
        });
      }
    }
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

const unwrapOptionalString = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && "tag" in value) {
    const tagged = value as { tag?: string; value?: unknown };
    if (tagged.tag === "some" && typeof tagged.value === "string") {
      return tagged.value;
    }
  }
  return null;
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
                "SELECT * FROM my_battle_sessions",
                "SELECT * FROM my_battle_combatants",
                "SELECT * FROM my_battle_cards",
                "SELECT * FROM my_quests",
                "SELECT * FROM my_player_flags",
                "SELECT * FROM my_player_vars",
                "SELECT * FROM my_vn_skill_results",
                "SELECT * FROM my_vn_sessions",
              ]);
          });

          const playerHex = identity.toHexString();
          await closeBattleIfOpen(conn, playerHex, nextRequestId);
          await conn.reducers.setFlag({ key: "son_duel_done", value: false });
          await conn.reducers.setFlag({ key: "son_duel_won", value: false });
          await conn.reducers.setFlag({ key: "son_duel_lost", value: false });

          await runScenarioPath(conn, "sandbox_banker_pilot", [
            {
              nodeId: "scene_bank_intro",
              passiveChecks: ["check_bank_first_impression"],
              choiceId: "BANK_INTRO_ACCEPT",
            },
            { nodeId: "scene_bank_intro_ch1", choiceId: "BANK_CH1_CONTINUE" },
            { nodeId: "scene_bank_leads", choiceId: "BANK_LEAD_HOUSE" },
            { nodeId: "scene_bank_leads", choiceId: "BANK_LEAD_CASINO" },
          ]);

          const bankerBattle = getCurrentBattleSession(conn, playerHex);
          if (!bankerBattle || bankerBattle.scenarioId !== "sandbox_son_duel") {
            throw new Error("Banker route did not open sandbox_son_duel");
          }

          const resolvedBattle = await playOutBattle(
            conn,
            playerHex,
            nextRequestId,
            "victory",
          );
          if (resolvedBattle.resultType !== "victory") {
            throw new Error(
              "Banker MVP route battle did not resolve to victory",
            );
          }

          await conn.reducers.closeBattleMode({
            requestId: nextRequestId("close_banker_battle"),
          });
          await conn.reducers.recordChoice({
            requestId: nextRequestId("banker_resolution"),
            scenarioId: "sandbox_banker_pilot",
            choiceId: resolveChoiceId(
              "scene_bank_resolution",
              "BANK_RESOLUTION_WIN",
            ),
          });

          await runScenarioPath(conn, "sandbox_dog_pilot", [
            { nodeId: "scene_dog_briefing", choiceId: "DOG_BRIEFING_CONTINUE" },
            { nodeId: "scene_dog_leads", choiceId: "DOG_LEAD_MARKET" },
            {
              nodeId: "scene_dog_market_encounter",
              choiceId: "DOG_MARKET_QUIET_NOTE",
            },
            {
              nodeId: "scene_dog_market_beat2",
              choiceId: "DOG_MARKET_BEAT2_RETURN",
            },
            { nodeId: "scene_dog_leads", choiceId: "DOG_LEAD_STATION" },
            {
              nodeId: "scene_dog_station_encounter",
              choiceId: "DOG_STATION_INTERVIEW",
            },
            {
              nodeId: "scene_dog_station_beat2",
              choiceId: "DOG_STATION_BEAT2_RETURN",
            },
            { nodeId: "scene_dog_leads", choiceId: "DOG_LEAD_TAILOR" },
            {
              nodeId: "scene_dog_tailor_encounter",
              choiceId: "DOG_TAILOR_AUDIT_BOOKS",
            },
            {
              nodeId: "scene_dog_tailor_beat2",
              choiceId: "DOG_TAILOR_BEAT2_RETURN",
            },
            { nodeId: "scene_dog_leads", choiceId: "DOG_LEAD_UNI" },
            {
              nodeId: "scene_dog_uni_encounter",
              choiceId: "DOG_UNI_ARCHIVE_REQUEST",
            },
            { nodeId: "scene_dog_leads", choiceId: "DOG_LEAD_PUB" },
            {
              nodeId: "scene_dog_pub_encounter",
              choiceId: "DOG_PUB_TRUST_BARTENDER",
            },
            {
              nodeId: "scene_dog_pub_beat2",
              choiceId: "DOG_PUB_BEAT2_RETURN",
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
              passiveChecks: ["check_ghost_cold_draft"],
              activeChecks: ["check_ghost_thermometer"],
              choiceId: "GHOST_EVIDENCE_THERMOMETER",
            },
            {
              nodeId: "scene_evidence_collection_beat1",
              choiceId: "GHOST_COLLECT_MORE",
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

          const ghostThermometerResult = [
            ...conn.db.vnSkillCheckResult.iter(),
          ].find(
            (row) =>
              row.playerId.toHexString() === playerHex &&
              row.scenarioId === "sandbox_ghost_pilot" &&
              row.checkId === "check_ghost_thermometer",
          );
          if (!ghostThermometerResult) {
            throw new Error(
              "Ghost route did not persist thermometer skill result",
            );
          }

          const ghostOutcomeGrade = unwrapOptionalString(
            ghostThermometerResult.outcomeGrade,
          );
          if (
            ghostOutcomeGrade !== "success" &&
            ghostOutcomeGrade !== "critical" &&
            ghostOutcomeGrade !== "success_with_cost"
          ) {
            throw new Error(
              `Unexpected ghost thermometer outcome grade: ${ghostOutcomeGrade ?? "null"}`,
            );
          }

          const ghostBreakdownJson = unwrapOptionalString(
            ghostThermometerResult.breakdownJson,
          );
          if (!ghostBreakdownJson || !ghostBreakdownJson.includes("voice")) {
            throw new Error(
              "Ghost thermometer result is missing deterministic breakdownJson",
            );
          }

          assertQuestStageAtLeast(conn, playerHex, "quest_banker", 3);
          assertQuestStageAtLeast(conn, playerHex, "quest_dog", 2);
          assertQuestStageAtLeast(conn, playerHex, "quest_ghost", 3);

          assertFlagTrue(conn, playerHex, "banker_case_closed");
          assertFlagTrue(conn, playerHex, "dog_reunion_reached");
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
