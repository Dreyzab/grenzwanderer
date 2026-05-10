import { DbConnection } from "../src/shared/spacetime/bindings";
import {
  createRequestIdFactory,
  expectRejected,
  getPlayerVarValue,
  hasMindFact,
  loadPilotSnapshot,
  publishPilotSnapshot,
  resolveChoiceId,
  subscribeSocialTables,
} from "./social-smoke-helpers";

const host = process.env.SMOKE_STDB_HOST ?? "ws://127.0.0.1:3000";
const database = process.env.SMOKE_STDB_DB ?? "grezwandererdata";
const scenarioId = "case01_hbf_arrival";
const runId = String(Date.now());
const snapshot = loadPilotSnapshot();
const nextRequestId = createRequestIdFactory("smoke_inner_parliament", runId);

const trainEntrySteps = [
  {
    nodeId: "scene_case01_opening_arrival_video",
    choiceId: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_CINEMA",
  },
  {
    nodeId: "scene_case01_train_compartment_letter",
    choiceId: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_LETTER",
  },
  {
    nodeId: "scene_case01_train_assistant_intro",
    choiceId: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_ASSISTANT_INTRO",
  },
] as const;

let contentPublished = false;

const recordChoice = async (
  conn: DbConnection,
  nodeId: string,
  choiceId: string,
): Promise<void> => {
  await conn.reducers.recordChoice({
    requestId: nextRequestId(`choice_${choiceId}`),
    scenarioId,
    choiceId: resolveChoiceId(snapshot.nodeById, nodeId, choiceId),
  });
};

const runPlayerSmoke = async (
  label: string,
  routeChoiceId: string,
  assertRoute: (conn: DbConnection, playerHex: string) => Promise<void>,
): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    let finished = false;

    DbConnection.builder()
      .withUri(host)
      .withDatabaseName(database)
      .onConnect(async (conn) => {
        try {
          const identity = conn.identity;
          if (!identity) {
            throw new Error("Missing connection identity");
          }

          const playerHex = identity.toHexString();
          if (!contentPublished) {
            await publishPilotSnapshot(
              conn,
              snapshot,
              nextRequestId,
              "smoke_inner_parliament",
            );
            contentPublished = true;
          }
          await subscribeSocialTables(conn);
          await conn.reducers.beginFreiburgOrigin({
            requestId: nextRequestId(`origin_${label}`),
            profileId: "detective",
            resetProgress: true,
          });
          for (const step of [
            ...trainEntrySteps,
            {
              nodeId: "scene_case01_train_door_creaks",
              choiceId: routeChoiceId,
            },
          ]) {
            await recordChoice(conn, step.nodeId, step.choiceId);
          }

          await assertRoute(conn, playerHex);

          finished = true;
          conn.disconnect();
          resolve();
        } catch (error) {
          conn.disconnect();
          reject(new Error(`${label} failed`, { cause: error }));
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

try {
  await runPlayerSmoke(
    "Logic negative path",
    "CASE01_TRAIN_DOOR_CREAKS_LOGIC",
    async (conn, playerHex) => {
      const analystRank = getPlayerVarValue(
        conn,
        playerHex,
        "inner_voice_rank_inner_analyst",
      );
      const leaderRank = getPlayerVarValue(
        conn,
        playerHex,
        "inner_voice_rank_inner_leader",
      );
      if (analystRank !== 1) {
        throw new Error(`Expected analyst rank 1, got ${analystRank}`);
      }
      if (leaderRank !== 0) {
        throw new Error(
          `Expected leader rank 0 on Logic route, got ${leaderRank}`,
        );
      }

      await expectRejected(
        () =>
          recordChoice(
            conn,
            "scene_case01_train_assistant_departure",
            "CASE01_TRAIN_ASSISTANT_LEADER_COMMITMENT",
          ),
        "Choice gating conditions are not satisfied",
      );
    },
  );

  await runPlayerSmoke(
    "Authority positive path",
    "CASE01_TRAIN_DOOR_CREAKS_AUTHORITY",
    async (conn, playerHex) => {
      const leaderRank = getPlayerVarValue(
        conn,
        playerHex,
        "inner_voice_rank_inner_leader",
      );
      if (leaderRank !== 1) {
        throw new Error(`Expected leader rank 1, got ${leaderRank}`);
      }

      await recordChoice(
        conn,
        "scene_case01_train_assistant_departure",
        "CASE01_TRAIN_ASSISTANT_LEADER_COMMITMENT",
      );
      if (!hasMindFact(conn, playerHex, "fact_inner_leader_route_committed")) {
        throw new Error(
          "Leader-gated follow-up did not discover its Mind Palace fact",
        );
      }
    },
  );

  console.log("Inner Parliament smoke script passed.");
} catch (error) {
  console.error("Inner Parliament smoke script failed:", error);
  process.exitCode = 1;
}
