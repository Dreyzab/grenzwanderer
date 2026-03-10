import { createHash } from "node:crypto";
import { DbConnection } from "../src/module_bindings";
import {
  ensureAdminAccess,
  getOperatorToken,
  persistOperatorToken,
} from "./spacetime-operator";

const host = process.env.SMOKE_STDB_HOST ?? "ws://127.0.0.1:3000";
const database = process.env.SMOKE_STDB_DB ?? "grezwandererdata";
const runId = String(Date.now());

const ids = {
  scenarioAuthority: `authority_core_${runId}`,
  scenarioSource: `source_gate_${runId}`,
  scenarioTarget: `target_gate_${runId}`,
  nodeAuthorityStart: `authority_node_start_${runId}`,
  nodeAfterFail: `authority_node_after_fail_${runId}`,
  nodeAfterPass: `authority_node_after_pass_${runId}`,
  nodeAfterConditional: `authority_node_after_conditional_${runId}`,
  nodeBlocked: `authority_node_blocked_${runId}`,
  nodeSourceStart: `source_gate_start_${runId}`,
  nodeSourceDone: `source_gate_done_${runId}`,
  nodeTargetStart: `target_gate_start_${runId}`,
  choiceSkillFail: `AUTH_CHOICE_SKILL_FAIL_${runId}`,
  choiceSkillPass: `AUTH_CHOICE_SKILL_PASS_${runId}`,
  choiceConditionalCheck: `AUTH_CHOICE_CONDITIONAL_CHECK_${runId}`,
  choiceBlockedNode: `AUTH_CHOICE_BLOCKED_NODE_${runId}`,
  choiceSourceFinish: `SOURCE_GATE_FINISH_${runId}`,
  checkFail: `auth_check_fail_${runId}`,
  checkPass: `auth_check_pass_${runId}`,
  checkConditional: `auth_check_conditional_${runId}`,
  flagUnlockCheck: `unlock_check_${runId}`,
  flagAllowBlockedNode: `allow_blocked_node_${runId}`,
  flagGateReady: `gate_ready_${runId}`,
};

const payload = {
  schemaVersion: 1,
  vnRuntime: {
    skillCheckDice: "d20",
  },
  scenarios: [
    {
      id: ids.scenarioAuthority,
      title: "Authority Core",
      startNodeId: ids.nodeAuthorityStart,
      nodeIds: [
        ids.nodeAuthorityStart,
        ids.nodeAfterFail,
        ids.nodeAfterPass,
        ids.nodeAfterConditional,
        ids.nodeBlocked,
      ],
    },
    {
      id: ids.scenarioSource,
      title: "Source Gate",
      startNodeId: ids.nodeSourceStart,
      nodeIds: [ids.nodeSourceStart, ids.nodeSourceDone],
      completionRoute: {
        nextScenarioId: ids.scenarioTarget,
        requiredFlagsAll: [ids.flagGateReady],
      },
    },
    {
      id: ids.scenarioTarget,
      title: "Target Gate",
      startNodeId: ids.nodeTargetStart,
      nodeIds: [ids.nodeTargetStart],
    },
  ],
  nodes: [
    {
      id: ids.nodeAuthorityStart,
      scenarioId: ids.scenarioAuthority,
      title: "Authority Start",
      body: "Start node",
      choices: [
        {
          id: ids.choiceSkillFail,
          text: "Requires failed skill check",
          nextNodeId: ids.nodeAfterFail,
          skillCheck: {
            id: ids.checkFail,
            voiceId: "attr_intellect",
            difficulty: 100,
          },
        },
        {
          id: ids.choiceSkillPass,
          text: "Requires successful skill check",
          nextNodeId: ids.nodeAfterPass,
          skillCheck: {
            id: ids.checkPass,
            voiceId: "attr_intellect",
            difficulty: 0,
          },
        },
        {
          id: ids.choiceConditionalCheck,
          text: "Conditional skill choice",
          nextNodeId: ids.nodeAfterConditional,
          conditions: [
            { type: "flag_equals", key: ids.flagUnlockCheck, value: true },
          ],
          skillCheck: {
            id: ids.checkConditional,
            voiceId: "attr_intellect",
            difficulty: 0,
          },
        },
        {
          id: ids.choiceBlockedNode,
          text: "Go to preconditioned node",
          nextNodeId: ids.nodeBlocked,
        },
      ],
    },
    {
      id: ids.nodeAfterFail,
      scenarioId: ids.scenarioAuthority,
      title: "After fail",
      body: "After fail",
      terminal: true,
      choices: [],
    },
    {
      id: ids.nodeAfterPass,
      scenarioId: ids.scenarioAuthority,
      title: "After pass",
      body: "After pass",
      terminal: true,
      choices: [],
    },
    {
      id: ids.nodeAfterConditional,
      scenarioId: ids.scenarioAuthority,
      title: "After conditional",
      body: "After conditional",
      terminal: true,
      choices: [],
    },
    {
      id: ids.nodeBlocked,
      scenarioId: ids.scenarioAuthority,
      title: "Blocked node",
      body: "Blocked",
      terminal: true,
      preconditions: [
        { type: "flag_equals", key: ids.flagAllowBlockedNode, value: true },
      ],
      choices: [],
    },
    {
      id: ids.nodeSourceStart,
      scenarioId: ids.scenarioSource,
      title: "Source start",
      body: "Source start",
      choices: [
        {
          id: ids.choiceSourceFinish,
          text: "Finish source gate",
          nextNodeId: ids.nodeSourceDone,
          effects: [{ type: "set_flag", key: ids.flagGateReady, value: true }],
        },
      ],
    },
    {
      id: ids.nodeSourceDone,
      scenarioId: ids.scenarioSource,
      title: "Source done",
      body: "Source done",
      terminal: true,
      choices: [],
    },
    {
      id: ids.nodeTargetStart,
      scenarioId: ids.scenarioTarget,
      title: "Target start",
      body: "Target start",
      terminal: true,
      choices: [],
    },
  ],
};

const payloadJson = JSON.stringify(payload);
const checksum = createHash("sha256").update(payloadJson, "utf8").digest("hex");

let requestCounter = 0;
const nextRequestId = (suffix: string): string => {
  requestCounter += 1;
  return `smoke_vn_authority_${runId}_${suffix}_${requestCounter}`;
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

const runUnauthorizedPublishCheck = async () =>
  new Promise<void>((resolve, reject) => {
    let finished = false;

    DbConnection.builder()
      .withUri(host)
      .withDatabaseName(database)
      .onConnect(async (conn) => {
        try {
          await expectRejected(
            () =>
              conn.reducers.publishContent({
                requestId: nextRequestId("publish_denied"),
                version: `smoke_vn_authority_denied_${runId}`,
                checksum,
                schemaVersion: 1,
                payloadJson,
              }),
            "Only an admin identity can publish content",
          );

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

    const builder = DbConnection.builder()
      .withUri(host)
      .withDatabaseName(database)
      .withToken(getOperatorToken(host, database))
      .onConnect(async (conn, _identity, token) => {
        try {
          persistOperatorToken(host, database, token);
          await ensureAdminAccess(conn);
          await conn.reducers.publishContent({
            requestId: nextRequestId("publish"),
            version: `smoke_vn_authority_${runId}`,
            checksum,
            schemaVersion: 1,
            payloadJson,
          });

          await conn.reducers.startScenario({
            requestId: nextRequestId("start_core_1"),
            scenarioId: ids.scenarioAuthority,
          });

          await expectRejected(
            () =>
              conn.reducers.recordChoice({
                requestId: nextRequestId("record_without_skill"),
                scenarioId: ids.scenarioAuthority,
                choiceId: ids.choiceSkillFail,
              }),
            "Skill check is required before this choice",
          );

          await expectRejected(
            () =>
              conn.reducers.performSkillCheck({
                requestId: nextRequestId("conditional_check"),
                scenarioId: ids.scenarioAuthority,
                checkId: ids.checkConditional,
              }),
            "Choice gating conditions are not satisfied for this skill check",
          );

          await conn.reducers.performSkillCheck({
            requestId: nextRequestId("skill_fail"),
            scenarioId: ids.scenarioAuthority,
            checkId: ids.checkFail,
          });

          await expectRejected(
            () =>
              conn.reducers.recordChoice({
                requestId: nextRequestId("record_after_fail"),
                scenarioId: ids.scenarioAuthority,
                choiceId: ids.choiceSkillFail,
              }),
            "Skill check failed",
          );

          await conn.reducers.performSkillCheck({
            requestId: nextRequestId("skill_pass"),
            scenarioId: ids.scenarioAuthority,
            checkId: ids.checkPass,
          });

          await conn.reducers.recordChoice({
            requestId: nextRequestId("record_after_pass"),
            scenarioId: ids.scenarioAuthority,
            choiceId: ids.choiceSkillPass,
          });

          await conn.reducers.startScenario({
            requestId: nextRequestId("start_core_2"),
            scenarioId: ids.scenarioAuthority,
          });

          await expectRejected(
            () =>
              conn.reducers.recordChoice({
                requestId: nextRequestId("record_blocked_node"),
                scenarioId: ids.scenarioAuthority,
                choiceId: ids.choiceBlockedNode,
              }),
            "Next node preconditions are not satisfied",
          );

          await expectRejected(
            () =>
              conn.reducers.startScenario({
                requestId: nextRequestId("start_target_blocked"),
                scenarioId: ids.scenarioTarget,
              }),
            "Scenario start is blocked by completion route rules",
          );

          await conn.reducers.startScenario({
            requestId: nextRequestId("start_source"),
            scenarioId: ids.scenarioSource,
          });
          await conn.reducers.recordChoice({
            requestId: nextRequestId("finish_source"),
            scenarioId: ids.scenarioSource,
            choiceId: ids.choiceSourceFinish,
          });

          await conn.reducers.startScenario({
            requestId: nextRequestId("start_target_allowed"),
            scenarioId: ids.scenarioTarget,
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
  await runUnauthorizedPublishCheck();
  await runSmoke();
  console.log("VN authority smoke script passed.");
} catch (error) {
  console.error("VN authority smoke script failed:", error);
  process.exitCode = 1;
}
