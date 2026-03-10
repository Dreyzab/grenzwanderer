import { createHash } from "node:crypto";
import { DbConnection } from "../src/module_bindings";
import {
  ensureAdminAccess,
  getOperatorToken,
  persistOperatorToken,
} from "./spacetime-operator";

const host = process.env.SMOKE_STDB_HOST ?? "ws://127.0.0.1:3000";
const database = process.env.SMOKE_STDB_DB ?? "grezwandererdata";

const payload = {
  schemaVersion: 2,
  scenarios: [
    {
      id: "mind_smoke_scenario",
      title: "Mind Smoke Scenario",
      startNodeId: "mind_node_1",
      nodeIds: ["mind_node_1", "mind_node_2", "mind_node_3"],
    },
  ],
  nodes: [
    {
      id: "mind_node_1",
      scenarioId: "mind_smoke_scenario",
      title: "Entry",
      body: "Collect first lead",
      choices: [
        {
          id: "mind_choice_a",
          text: "Inspect ledger",
          nextNodeId: "mind_node_2",
          effects: [
            {
              type: "discover_fact",
              caseId: "mind_smoke_case",
              factId: "mind_fact_1",
            },
          ],
        },
      ],
    },
    {
      id: "mind_node_2",
      scenarioId: "mind_smoke_scenario",
      title: "Middle",
      body: "Collect second lead",
      choices: [
        {
          id: "mind_choice_b",
          text: "Interview witness",
          nextNodeId: "mind_node_3",
          effects: [
            {
              type: "discover_fact",
              caseId: "mind_smoke_case",
              factId: "mind_fact_2",
            },
            { type: "set_var", key: "mind_confidence", value: 1 },
          ],
        },
      ],
    },
    {
      id: "mind_node_3",
      scenarioId: "mind_smoke_scenario",
      title: "End",
      body: "Hypothesis gate",
      terminal: true,
      choices: [],
    },
  ],
  mindPalace: {
    cases: [
      {
        id: "mind_smoke_case",
        title: "Mind Smoke Case",
      },
    ],
    facts: [
      {
        id: "mind_fact_1",
        caseId: "mind_smoke_case",
        sourceType: "vn_choice",
        sourceId: "mind_smoke_scenario::mind_node_1::mind_choice_a",
        text: "Ledger mismatch found.",
        tags: { source: "ledger" },
      },
      {
        id: "mind_fact_2",
        caseId: "mind_smoke_case",
        sourceType: "vn_choice",
        sourceId: "mind_smoke_scenario::mind_node_2::mind_choice_b",
        text: "Witness confirms timeline.",
        tags: { source: "witness" },
      },
    ],
    hypotheses: [
      {
        id: "mind_hyp_1",
        caseId: "mind_smoke_case",
        key: "smoke_hypothesis",
        text: "Internal theft confirmed.",
        requiredFactIds: ["mind_fact_1", "mind_fact_2"],
        requiredVars: [{ key: "mind_confidence", op: "gte", value: 1 }],
        rewardEffects: [
          { type: "set_flag", key: "mind_smoke_case_closed", value: true },
        ],
      },
    ],
  },
};

const payloadJson = JSON.stringify(payload);
const checksum = createHash("sha256").update(payloadJson, "utf8").digest("hex");

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
          await conn.reducers.publishContent({
            requestId: "mind_publish_1",
            version: "mind_smoke_v1",
            checksum,
            schemaVersion: 2,
            payloadJson,
          });

          await conn.reducers.startMindCase({
            requestId: "mind_case_start_1",
            caseId: "mind_smoke_case",
          });

          await conn.reducers.startScenario({
            requestId: "mind_start_scenario_1",
            scenarioId: "mind_smoke_scenario",
          });

          await conn.reducers.recordChoice({
            requestId: "mind_choice_record_1",
            scenarioId: "mind_smoke_scenario",
            choiceId: "mind_choice_a",
          });

          await conn.reducers.recordChoice({
            requestId: "mind_choice_record_2",
            scenarioId: "mind_smoke_scenario",
            choiceId: "mind_choice_b",
          });

          await conn.reducers.discoverFact({
            requestId: "mind_discover_noop_1",
            caseId: "mind_smoke_case",
            factId: "mind_fact_1",
          });

          let duplicateDiscoverRejected = false;
          try {
            await conn.reducers.discoverFact({
              requestId: "mind_discover_noop_1",
              caseId: "mind_smoke_case",
              factId: "mind_fact_1",
            });
          } catch (_error) {
            duplicateDiscoverRejected = true;
          }

          if (!duplicateDiscoverRejected) {
            throw new Error(
              "Mind smoke failed: duplicate discover_fact requestId was accepted",
            );
          }

          await conn.reducers.validateHypothesis({
            requestId: "mind_validate_1",
            caseId: "mind_smoke_case",
            hypothesisId: "mind_hyp_1",
          });

          let repeatedValidateRejected = false;
          try {
            await conn.reducers.validateHypothesis({
              requestId: "mind_validate_2",
              caseId: "mind_smoke_case",
              hypothesisId: "mind_hyp_1",
            });
          } catch (_error) {
            repeatedValidateRejected = true;
          }

          if (!repeatedValidateRejected) {
            throw new Error(
              "Mind smoke failed: repeated validate_hypothesis should be rejected",
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
  console.log("MindPalace smoke script passed.");
} catch (error) {
  console.error("MindPalace smoke script failed:", error);
  process.exitCode = 1;
}
