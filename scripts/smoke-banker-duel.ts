import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DbConnection } from "../src/module_bindings";
import {
  closeBattleIfOpen,
  getCurrentBattleSession,
  getPlayerFlagValue,
  getPlayerVarValue,
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
  checksum?: string;
  schemaVersion?: number;
  scenarios?: Array<{ id: string }>;
  nodes?: Array<{
    id: string;
    scenarioId: string;
    choices: Array<{ id: string }>;
  }>;
};

if (typeof parsedPayload.checksum !== "string" || !parsedPayload.checksum) {
  throw new Error("pilot.snapshot.json is missing checksum");
}
if (typeof parsedPayload.schemaVersion !== "number") {
  throw new Error("pilot.snapshot.json is missing schemaVersion");
}
if (
  !Array.isArray(parsedPayload.scenarios) ||
  !Array.isArray(parsedPayload.nodes)
) {
  throw new Error("pilot.snapshot.json has invalid scenarios/nodes shape");
}

const scenarioIds = new Set(parsedPayload.scenarios.map((entry) => entry.id));
const nodeById = new Map(parsedPayload.nodes.map((entry) => [entry.id, entry]));

let requestCounter = 0;
const nextRequestId = (suffix: string): string => {
  requestCounter += 1;
  return `smoke_banker_duel_${runId}_${suffix}_${requestCounter}`;
};

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
    return node.choices[0]!.id;
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
        });
      }
    }

    await conn.reducers.recordChoice({
      requestId: nextRequestId(`choice_${scenarioId}_${step.choiceId}`),
      scenarioId,
      choiceId: resolveChoiceId(step.nodeId, step.choiceId),
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
          const identity = conn.identity;
          if (!identity) {
            throw new Error("Missing connection identity");
          }

          const playerHex = identity.toHexString();
          await conn.reducers.publishContent({
            requestId: nextRequestId("publish"),
            version: `smoke_banker_duel_${runId}`,
            checksum: parsedPayload.checksum!,
            schemaVersion: parsedPayload.schemaVersion!,
            payloadJson,
          });

          await new Promise<void>((resolveSync) => {
            conn
              .subscriptionBuilder()
              .onApplied(() => resolveSync())
              .subscribe([
                "SELECT * FROM battle_session",
                "SELECT * FROM battle_combatant",
                "SELECT * FROM battle_card_instance",
                "SELECT * FROM player_flag",
                "SELECT * FROM player_var",
                "SELECT * FROM player_quest",
                "SELECT * FROM vn_session",
              ]);
          });

          await closeBattleIfOpen(conn, playerHex, nextRequestId);
          await conn.reducers.setFlag({
            key: "banker_case_closed",
            value: false,
          });
          await conn.reducers.setFlag({
            key: "banker_finale_started",
            value: false,
          });
          await conn.reducers.setFlag({ key: "son_duel_done", value: false });
          await conn.reducers.setFlag({ key: "son_duel_won", value: false });
          await conn.reducers.setFlag({ key: "son_duel_lost", value: false });

          const xpBefore = getPlayerVarValue(conn, playerHex, "xp_total");

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

          const battleSession = getCurrentBattleSession(conn, playerHex);
          if (!battleSession) {
            throw new Error(
              "BANK_LEAD_CASINO did not open an authoritative battle",
            );
          }
          if (
            battleSession.returnTab !== "vn" ||
            battleSession.sourceTab !== "vn"
          ) {
            throw new Error(
              "Banker battle session stored incorrect return/source tabs",
            );
          }
          if (battleSession.sourceScenarioId !== "sandbox_banker_pilot") {
            throw new Error(
              "Banker battle session did not retain its source scenario",
            );
          }

          const resolvedBattle = await playOutBattle(
            conn,
            playerHex,
            nextRequestId,
            "victory",
          );
          if (
            resolvedBattle.status !== "resolved" ||
            resolvedBattle.resultType !== "victory"
          ) {
            throw new Error("Banker duel did not resolve to victory");
          }
          if (!getPlayerFlagValue(conn, playerHex, "son_duel_done")) {
            throw new Error("Banker duel outcome did not mark son_duel_done");
          }
          if (!getPlayerFlagValue(conn, playerHex, "son_duel_won")) {
            throw new Error("Banker duel outcome did not mark son_duel_won");
          }

          await conn.reducers.closeBattleMode({
            requestId: nextRequestId("close_battle"),
          });
          await conn.reducers.recordChoice({
            requestId: nextRequestId("banker_wrapper_continue"),
            scenarioId: "sandbox_banker_pilot",
            choiceId: resolveChoiceId(
              "scene_bank_resolution",
              "BANK_RESOLUTION_WIN",
            ),
          });

          const questRow = [...conn.db.playerQuest.iter()].find(
            (entry) =>
              entry.playerId.toHexString() === playerHex &&
              entry.questId === "quest_banker",
          );
          const questStage = questRow ? Number(questRow.stage) : 0;
          if (questStage < 3) {
            throw new Error(
              `quest_banker stage is ${questStage}; expected at least 3 after duel fallout`,
            );
          }
          if (!getPlayerFlagValue(conn, playerHex, "banker_case_closed")) {
            throw new Error("Banker duel fallout did not close the case");
          }
          if (getPlayerFlagValue(conn, playerHex, "son_duel_lost")) {
            throw new Error(
              "Victory banker smoke should not leave son_duel_lost set",
            );
          }
          if (
            getPlayerVarValue(conn, playerHex, "xp_total") !==
            xpBefore + 50
          ) {
            throw new Error(
              "Banker duel should grant exactly 50 XP from battle resolution",
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
  console.log("Banker duel smoke script passed.");
} catch (error) {
  console.error("Banker duel smoke script failed:", error);
  process.exitCode = 1;
}
