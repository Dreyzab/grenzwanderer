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
  scenarios: Array<{
    id: string;
    startNodeId: string;
  }>;
  nodes: Array<{
    id: string;
    scenarioId: string;
    choices: Array<{ id: string }>;
  }>;
};

const loadSnapshot = (): {
  checksum: string;
  schemaVersion: number;
  payloadJson: string;
  payload: SnapshotPayload;
} => {
  const raw = readFileSync(snapshotPath, "utf8");
  const parsed = JSON.parse(raw) as SnapshotPayload;
  return {
    checksum: parsed.checksum,
    schemaVersion: parsed.schemaVersion,
    payloadJson: raw,
    payload: parsed,
  };
};

const resolveIntroStartChoiceId = (payload: SnapshotPayload): string => {
  const introScenario = payload.scenarios.find(
    (entry) => entry.id === "sandbox_intro_pilot",
  );
  if (!introScenario) {
    throw new Error("sandbox_intro_pilot scenario is missing from snapshot");
  }

  const startNode = payload.nodes.find(
    (entry) =>
      entry.id === introScenario.startNodeId &&
      entry.scenarioId === introScenario.id,
  );
  if (!startNode) {
    throw new Error(
      `Start node '${introScenario.startNodeId}' for sandbox_intro_pilot is missing from snapshot`,
    );
  }

  const preferred = startNode.choices.find(
    (choice) => choice.id === "START_CONTINUE",
  );
  if (preferred) {
    return preferred.id;
  }

  const autoContinue = startNode.choices.find((choice) =>
    choice.id.startsWith("AUTO_CONTINUE_"),
  );
  if (autoContinue) {
    return autoContinue.id;
  }

  const fallback = startNode.choices[0];
  if (!fallback) {
    throw new Error(
      `Start node '${startNode.id}' does not define any outbound choices`,
    );
  }

  return fallback.id;
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
          const introStartChoiceId = resolveIntroStartChoiceId(
            snapshot.payload,
          );
          const version = `smoke_origin_${Date.now()}`;

          await conn.reducers.publishContent({
            requestId: `smoke_origin_publish_${Date.now()}`,
            version,
            checksum: snapshot.checksum,
            schemaVersion: snapshot.schemaVersion,
            payloadJson: snapshot.payloadJson,
          });

          // Keep smoke deterministic on shared local DB: clear route blockers first.
          await conn.reducers.setFlag({
            key: "met_anna_intro",
            value: false,
          });
          await conn.reducers.setFlag({
            key: "origin_journalist_handoff_done",
            value: false,
          });

          await conn.reducers.startScenario({
            requestId: `smoke_origin_start_intro_${Date.now()}`,
            scenarioId: "sandbox_intro_pilot",
          });

          await conn.reducers.recordChoice({
            requestId: `smoke_origin_choice_start_${Date.now()}`,
            scenarioId: "sandbox_intro_pilot",
            choiceId: introStartChoiceId,
          });
          await conn.reducers.recordChoice({
            requestId: `smoke_origin_choice_lang_${Date.now()}`,
            scenarioId: "sandbox_intro_pilot",
            choiceId: "LANG_EN",
          });
          await conn.reducers.recordChoice({
            requestId: `smoke_origin_choice_origin_${Date.now()}`,
            scenarioId: "sandbox_intro_pilot",
            choiceId: "BACKSTORY_JOURNALIST",
          });

          // Guarantee success branch so completion-route blockers remain deterministic.
          await conn.reducers.setVar({
            key: "attr_deception",
            floatValue: 20,
          });

          await conn.reducers.startScenario({
            requestId: `smoke_origin_start_journalist_${Date.now()}`,
            scenarioId: "intro_journalist",
          });
          await conn.reducers.recordChoice({
            requestId: `smoke_origin_j_choice_1_${Date.now()}`,
            scenarioId: "intro_journalist",
            choiceId: "JOURNALIST_SELECTIVE_EXCAVATION",
          });
          await conn.reducers.recordChoice({
            requestId: `smoke_origin_j_choice_2_${Date.now()}`,
            scenarioId: "intro_journalist",
            choiceId: "JOURNALIST_KEY_SECRET_CONTINUE",
          });
          await conn.reducers.performSkillCheck({
            requestId: `smoke_origin_j_skill_${Date.now()}`,
            scenarioId: "intro_journalist",
            checkId: "check_journalist_show_seal",
          });
          await conn.reducers.recordChoice({
            requestId: `smoke_origin_j_choice_3_${Date.now()}`,
            scenarioId: "intro_journalist",
            choiceId: "JOURNALIST_TELEGRAM_CONTINUE",
          });
          await conn.reducers.recordChoice({
            requestId: `smoke_origin_j_choice_4_${Date.now()}`,
            scenarioId: "intro_journalist",
            choiceId: "JOURNALIST_TIP_CONTINUE",
          });

          // After completing intro_journalist once, completion route blockers should
          // prevent re-entering it directly from sandbox intro.
          let blockedAsExpected = false;
          try {
            await conn.reducers.startScenario({
              requestId: `smoke_origin_start_journalist_block_check_${Date.now()}`,
              scenarioId: "intro_journalist",
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            blockedAsExpected = message.includes(
              "Scenario start is blocked by completion route rules",
            );
          }

          if (!blockedAsExpected) {
            throw new Error(
              "Expected intro_journalist to be blocked by completion route rules after completion",
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
