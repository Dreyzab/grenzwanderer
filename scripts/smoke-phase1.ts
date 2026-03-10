import { createHash } from "node:crypto";
import { DbConnection } from "../src/module_bindings";
import {
  ensureAdminAccess,
  ensureWorkerAccess,
  getOperatorToken,
  persistOperatorToken,
} from "./spacetime-operator";

const host = process.env.SMOKE_STDB_HOST ?? "ws://127.0.0.1:3000";
const database = process.env.SMOKE_STDB_DB ?? "grezwandererdata";

const payload = {
  schemaVersion: 1,
  scenarios: [
    {
      id: "smoke_scenario",
      title: "Smoke Scenario",
      startNodeId: "smoke_node_1",
      nodeIds: ["smoke_node_1", "smoke_node_2", "smoke_node_3"],
    },
  ],
  nodes: [
    {
      id: "smoke_node_1",
      scenarioId: "smoke_scenario",
      title: "Start",
      body: "Start node",
      choices: [
        {
          id: "choice_a",
          text: "Go to middle",
          nextNodeId: "smoke_node_2",
          effects: [{ type: "set_flag", key: "smoke_choice_a", value: true }],
        },
      ],
    },
    {
      id: "smoke_node_2",
      scenarioId: "smoke_scenario",
      title: "Middle",
      body: "Middle node",
      choices: [
        {
          id: "choice_b",
          text: "Finish",
          nextNodeId: "smoke_node_3",
          effects: [{ type: "set_var", key: "smoke_var", value: 2 }],
        },
      ],
    },
    {
      id: "smoke_node_3",
      scenarioId: "smoke_scenario",
      title: "End",
      body: "Terminal node",
      terminal: true,
      choices: [],
    },
  ],
};

const payloadJson = JSON.stringify(payload);
const checksum = createHash("sha256").update(payloadJson, "utf8").digest("hex");

const waitForAiRequest = async (
  conn: DbConnection,
  requestId: string,
): Promise<{ id: bigint; requestId: string }> => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const row = [...conn.db.aiRequest.iter()].find(
      (entry) => entry.requestId === requestId,
    );
    if (row) {
      return row;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  throw new Error("AI smoke failed: queued request was not persisted");
};

const runUnauthorizedWorkerChecks = async (
  request: (suffix: string) => string,
): Promise<void> =>
  new Promise((resolve, reject) => {
    let finished = false;

    DbConnection.builder()
      .withUri(host)
      .withDatabaseName(database)
      .onConnect(async (conn) => {
        try {
          let unauthorizedRegisterRejected = false;
          try {
            await conn.reducers.registerWorkerIdentity({});
          } catch (_error) {
            unauthorizedRegisterRejected = true;
          }

          if (!unauthorizedRegisterRejected) {
            throw new Error(
              "AI smoke failed: non-allowlisted register_worker_identity was accepted",
            );
          }

          let unauthorizedDeliverRejected = false;
          try {
            await conn.reducers.deliverThought({
              requestId: request("ai_deliver_denied"),
              aiRequestId: 0n,
              status: "processing",
              responseJson: undefined,
              error: undefined,
            });
          } catch (_error) {
            unauthorizedDeliverRejected = true;
          }

          if (!unauthorizedDeliverRejected) {
            throw new Error(
              "AI smoke failed: unauthorized deliver_thought was accepted",
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
      })
      .build();
  });

const runSmoke = async () =>
  new Promise<void>((resolve, reject) => {
    let finished = false;
    const runId = Date.now();
    const request = (suffix: string) => `smoke_${suffix}_${runId}`;

    const builder = DbConnection.builder()
      .withUri(host)
      .withDatabaseName(database)
      .withToken(getOperatorToken(host, database))
      .onConnect(async (conn, _identity, token) => {
        try {
          persistOperatorToken(host, database, token);
          await ensureAdminAccess(conn);
          await new Promise<void>((resolveSync) => {
            conn
              .subscriptionBuilder()
              .onApplied(() => resolveSync())
              .subscribe(["SELECT * FROM ai_request"]);
          });
          await conn.reducers.publishContent({
            requestId: request("publish"),
            version: `smoke_v1_${runId}`,
            checksum,
            schemaVersion: 1,
            payloadJson,
          });

          await conn.reducers.startScenario({
            requestId: request("start"),
            scenarioId: "smoke_scenario",
          });

          await conn.reducers.recordChoice({
            requestId: request("choice_1"),
            scenarioId: "smoke_scenario",
            choiceId: "choice_a",
          });

          await conn.reducers.recordChoice({
            requestId: request("choice_2"),
            scenarioId: "smoke_scenario",
            choiceId: "choice_b",
          });

          const buyRequestId = request("buy");
          await conn.reducers.buyItem({
            requestId: buyRequestId,
            itemId: "smoke_item",
            quantity: 1,
          });

          let duplicateBuyRejected = false;
          try {
            await conn.reducers.buyItem({
              requestId: buyRequestId,
              itemId: "smoke_item",
              quantity: 1,
            });
          } catch (_error) {
            duplicateBuyRejected = true;
          }

          if (!duplicateBuyRejected) {
            throw new Error(
              "Idempotency smoke failed: duplicate buy_item was accepted",
            );
          }

          await conn.reducers.setFlag({
            key: "smoke_noncritical",
            value: false,
          });
          await conn.reducers.setFlag({
            key: "smoke_noncritical",
            value: true,
          });

          await conn.reducers.setVar({ key: "smoke_metric", floatValue: 1.25 });
          await conn.reducers.setVar({ key: "smoke_metric", floatValue: -0.5 });

          await conn.reducers.enqueueAiRequest({
            requestId: request("ai"),
            kind: "summary",
            payloadJson: '{"prompt":"smoke"}',
          });
          const aiRequest = await waitForAiRequest(conn, request("ai"));
          await runUnauthorizedWorkerChecks(request);

          await ensureWorkerAccess(conn);

          await conn.reducers.deliverThought({
            requestId: request("ai_deliver_ok"),
            aiRequestId: aiRequest.id,
            status: "completed",
            responseJson: '{"result":"ok"}',
            error: undefined,
          });

          await conn.reducers.trackEvent({
            eventName: "smoke_event",
            tagsJson: '{"source":"smoke"}',
            value: 1,
          });

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
  console.log("Phase 0-1 smoke script passed.");
} catch (error) {
  console.error("Phase 0-1 smoke script failed:", error);
  process.exitCode = 1;
}
