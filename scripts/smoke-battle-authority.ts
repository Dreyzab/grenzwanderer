import { createHash } from "node:crypto";
import { DbConnection } from "../src/module_bindings";
import { createTestSnapshot } from "../src/features/vn/snapshotTestUtils";
import { parseSnapshot } from "../src/features/vn/vnContent";
import {
  closeBattleIfOpen,
  getCurrentBattleSession,
  getLatestBattleSession,
  getPlayerFlagValue,
  getPlayerVarValue,
  playOutBattle,
} from "./battle-smoke-helpers";

const host = process.env.SMOKE_STDB_HOST ?? "ws://127.0.0.1:3000";
const database = process.env.SMOKE_STDB_DB ?? "grezwandererdata";
const runId = String(Date.now());

const ids = {
  scenarioVn: `battle_vn_source_${runId}`,
  nodeVnStart: `battle_vn_start_${runId}`,
  nodeVnWrapper: `battle_vn_wrapper_${runId}`,
  nodeVnResult: `battle_vn_result_${runId}`,
  choiceVnOpenBattle: `BATTLE_VN_OPEN_${runId}`,
  choiceVnResolved: `BATTLE_VN_RESOLVED_${runId}`,
  pointBattle: `battle_point_${runId}`,
  bindingBattle: `battle_binding_${runId}`,
  flagVnResolved: `battle_vn_resolved_${runId}`,
};

const payload = createTestSnapshot({
  schemaVersion: 3,
  scenarios: [
    {
      id: ids.scenarioVn,
      title: "Battle Authority Bridge",
      startNodeId: ids.nodeVnStart,
      nodeIds: [ids.nodeVnStart, ids.nodeVnWrapper, ids.nodeVnResult],
    },
  ],
  nodes: [
    {
      id: ids.nodeVnStart,
      scenarioId: ids.scenarioVn,
      title: "Open Duel",
      body: "Open the authoritative battle from VN.",
      choices: [
        {
          id: ids.choiceVnOpenBattle,
          text: "Enter the duel",
          nextNodeId: ids.nodeVnWrapper,
          effects: [
            {
              type: "open_battle_mode",
              scenarioId: "sandbox_son_duel",
              returnTab: "vn",
            },
          ],
        },
      ],
    },
    {
      id: ids.nodeVnWrapper,
      scenarioId: ids.scenarioVn,
      title: "Return Wrapper",
      body: "Continue once the duel outcome has resolved.",
      choices: [
        {
          id: ids.choiceVnResolved,
          text: "Continue",
          nextNodeId: ids.nodeVnResult,
          conditions: [{ type: "flag_equals", key: "son_duel_won", value: true }],
        },
      ],
    },
    {
      id: ids.nodeVnResult,
      scenarioId: ids.scenarioVn,
      title: "Resolved",
      body: "VN wrapper fallout completed.",
      terminal: true,
      onEnter: [{ type: "set_flag", key: ids.flagVnResolved, value: true }],
      choices: [],
    },
  ],
  map: {
    defaultRegionId: "FREIBURG_1905",
    regions: [
      {
        id: "FREIBURG_1905",
        name: "Freiburg",
        geoCenterLat: 47.9959,
        geoCenterLng: 7.8522,
        zoom: 14.2,
      },
    ],
    points: [
      {
        id: ids.pointBattle,
        title: "Battle Point",
        regionId: "FREIBURG_1905",
        lat: 47.99,
        lng: 7.84,
        category: "HUB",
        locationId: "loc_battle_point",
        defaultState: "discovered",
        bindings: [
          {
            id: ids.bindingBattle,
            trigger: "card_primary",
            label: "Open duel",
            priority: 100,
            intent: "interaction",
            actions: [
              {
                type: "open_battle_mode",
                scenarioId: "sandbox_son_duel",
                returnTab: "map",
              },
            ],
          },
        ],
      },
    ],
    shadowRoutes: [],
    qrCodeRegistry: [],
    mapEventTemplates: [],
  },
  questCatalog: [],
});

const payloadJson = JSON.stringify(payload);
const checksum = createHash("sha256").update(payloadJson, "utf8").digest("hex");
if (!parseSnapshot(payloadJson)) {
  throw new Error("Battle authority synthetic snapshot failed frontend parsing");
}

let requestCounter = 0;
const nextRequestId = (suffix: string): string => {
  requestCounter += 1;
  return `smoke_battle_authority_${runId}_${suffix}_${requestCounter}`;
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

          const playerHex = identity.toHexString();
          await conn.reducers.publishContent({
            requestId: nextRequestId("publish"),
            version: `smoke_battle_authority_${runId}`,
            checksum,
            schemaVersion: 3,
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
                "SELECT * FROM battle_history",
                "SELECT * FROM player_flag",
                "SELECT * FROM player_var",
                "SELECT * FROM vn_session",
              ]);
          });

          await closeBattleIfOpen(conn, playerHex, nextRequestId);
          await conn.reducers.setFlag({ key: "son_duel_done", value: false });
          await conn.reducers.setFlag({ key: "son_duel_won", value: false });
          await conn.reducers.setFlag({ key: "son_duel_lost", value: false });
          await conn.reducers.setFlag({ key: ids.flagVnResolved, value: false });

          const xpBefore = getPlayerVarValue(conn, playerHex, "xp_total");

          await conn.reducers.mapInteract({
            requestId: nextRequestId("map_open"),
            pointId: ids.pointBattle,
            bindingId: ids.bindingBattle,
            trigger: "card_primary",
          });

          const mapSession = getCurrentBattleSession(conn, playerHex);
          if (!mapSession) {
            throw new Error("Map binding did not open battle_session");
          }
          if (mapSession.sourceTab !== "map" || mapSession.returnTab !== "map") {
            throw new Error("Map-opened battle session stored incorrect source/return tabs");
          }

          await conn.reducers.closeBattleMode({
            requestId: nextRequestId("map_close"),
          });

          const closedMapSession = getLatestBattleSession(conn, playerHex);
          if (!closedMapSession || closedMapSession.status !== "closed") {
            throw new Error("Map-opened battle session did not close cleanly");
          }
          if (getPlayerVarValue(conn, playerHex, "xp_total") !== xpBefore) {
            throw new Error("Closing an unresolved battle should not grant XP");
          }

          await conn.reducers.startScenario({
            requestId: nextRequestId("vn_start"),
            scenarioId: ids.scenarioVn,
          });
          await conn.reducers.recordChoice({
            requestId: nextRequestId("vn_open"),
            scenarioId: ids.scenarioVn,
            choiceId: ids.choiceVnOpenBattle,
          });

          const vnSession = getCurrentBattleSession(conn, playerHex);
          if (!vnSession) {
            throw new Error("VN effect did not open battle_session");
          }
          if (vnSession.sourceTab !== "vn" || vnSession.returnTab !== "vn") {
            throw new Error("VN-opened battle session stored incorrect source/return tabs");
          }
          if (vnSession.sourceScenarioId !== ids.scenarioVn) {
            throw new Error("VN-opened battle session did not retain sourceScenarioId");
          }

          const resolvedSession = await playOutBattle(
            conn,
            playerHex,
            nextRequestId,
            "victory",
          );
          if (Number(resolvedSession.turnCount) < 2) {
            throw new Error("Battle authority smoke expected at least one enemy turn");
          }
          if (resolvedSession.status !== "resolved" || resolvedSession.phase !== "result") {
            throw new Error("Resolved battle session did not enter result phase");
          }
          if (!getPlayerFlagValue(conn, playerHex, "son_duel_done")) {
            throw new Error("Battle outcome did not set son_duel_done");
          }
          if (!getPlayerFlagValue(conn, playerHex, "son_duel_won")) {
            throw new Error("Battle outcome did not set son_duel_won");
          }
          if (getPlayerFlagValue(conn, playerHex, "son_duel_lost")) {
            throw new Error("Victory outcome should clear son_duel_lost");
          }
          if (getPlayerVarValue(conn, playerHex, "xp_total") !== xpBefore + 50) {
            throw new Error("Battle outcome did not apply XP exactly once");
          }

          await conn.reducers.closeBattleMode({
            requestId: nextRequestId("vn_close"),
          });

          const closedVnSession = getLatestBattleSession(conn, playerHex);
          if (!closedVnSession || closedVnSession.status !== "closed") {
            throw new Error("Resolved battle session did not close cleanly");
          }
          if (closedVnSession.returnTab !== "vn") {
            throw new Error("Closed VN battle session lost its returnTab");
          }

          await conn.reducers.recordChoice({
            requestId: nextRequestId("vn_wrapper_continue"),
            scenarioId: ids.scenarioVn,
            choiceId: ids.choiceVnResolved,
          });

          if (!getPlayerFlagValue(conn, playerHex, ids.flagVnResolved)) {
            throw new Error("VN wrapper fallout did not complete after battle return");
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
  console.log("Battle authority smoke script passed.");
} catch (error) {
  console.error("Battle authority smoke script failed:", error);
  process.exitCode = 1;
}
