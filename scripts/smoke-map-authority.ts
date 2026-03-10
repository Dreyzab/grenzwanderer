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
  scenarioCase: `map_case_${runId}`,
  scenarioNode: `map_case_node_${runId}`,
  pointTravel: `point_travel_${runId}`,
  pointCase: `point_case_${runId}`,
  pointLocked: `point_locked_${runId}`,
  bindingTravel: `sys_travel_point_travel_${runId}`,
  bindingCaseStart: `bind_case_start_${runId}`,
  bindingCaseTravel: `sys_travel_point_case_${runId}`,
  bindingLocked: `bind_locked_${runId}`,
  gateFlag: `gate_flag_${runId}`,
};

const payload = {
  schemaVersion: 3,
  scenarios: [
    {
      id: ids.scenarioCase,
      title: "Map Case",
      startNodeId: ids.scenarioNode,
      nodeIds: [ids.scenarioNode],
    },
  ],
  nodes: [
    {
      id: ids.scenarioNode,
      scenarioId: ids.scenarioCase,
      title: "Case Start",
      body: "Scenario opened from map",
      terminal: true,
      choices: [],
    },
  ],
  mindPalace: {
    cases: [],
    facts: [],
    hypotheses: [],
  },
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
        id: ids.pointTravel,
        title: "Travel Point",
        regionId: "FREIBURG_1905",
        lat: 47.99,
        lng: 7.84,
        category: "HUB",
        locationId: "loc_map_travel",
        defaultState: "discovered",
        bindings: [
          {
            id: ids.bindingTravel,
            trigger: "card_secondary",
            label: "Travel",
            priority: 10,
            intent: "travel",
            actions: [{ type: "travel_to", locationId: "loc_map_travel" }],
          },
        ],
      },
      {
        id: ids.pointCase,
        title: "Case Point",
        regionId: "FREIBURG_1905",
        lat: 47.991,
        lng: 7.845,
        category: "HUB",
        locationId: "loc_map_case",
        defaultState: "discovered",
        bindings: [
          {
            id: ids.bindingCaseStart,
            trigger: "card_primary",
            label: "Start Case",
            priority: 100,
            intent: "objective",
            actions: [{ type: "start_scenario", scenarioId: ids.scenarioCase }],
          },
          {
            id: ids.bindingCaseTravel,
            trigger: "card_secondary",
            label: "Travel",
            priority: 10,
            intent: "travel",
            actions: [{ type: "travel_to", locationId: "loc_map_case" }],
          },
        ],
      },
      {
        id: ids.pointLocked,
        title: "Locked Point",
        regionId: "FREIBURG_1905",
        lat: 47.992,
        lng: 7.846,
        category: "HUB",
        locationId: "loc_locked_case",
        defaultState: "locked",
        bindings: [
          {
            id: ids.bindingLocked,
            trigger: "card_primary",
            label: "Blocked Action",
            priority: 50,
            intent: "interaction",
            conditions: [{ type: "flag_is", key: ids.gateFlag, value: true }],
            actions: [{ type: "travel_to", locationId: "loc_locked_case" }],
          },
        ],
      },
    ],
  },
};

const payloadJson = JSON.stringify(payload);
const checksum = createHash("sha256").update(payloadJson, "utf8").digest("hex");

let requestCounter = 0;
const nextRequestId = (suffix: string): string => {
  requestCounter += 1;
  return `smoke_map_authority_${runId}_${suffix}_${requestCounter}`;
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
            version: `smoke_map_authority_${runId}`,
            checksum,
            schemaVersion: 3,
            payloadJson,
          });

          await new Promise<void>((resolveSync) => {
            conn
              .subscriptionBuilder()
              .onApplied(() => resolveSync())
              .subscribe([
                "SELECT * FROM player_location",
                "SELECT * FROM player_flag",
                "SELECT * FROM vn_session",
              ]);
          });

          await conn.reducers.mapInteract({
            requestId: nextRequestId("travel"),
            pointId: ids.pointTravel,
            bindingId: ids.bindingTravel,
            trigger: "card_secondary",
          });

          const travelLocation = conn.db.playerLocation.playerId.find(identity);
          if (
            !travelLocation ||
            travelLocation.locationId !== "loc_map_travel"
          ) {
            throw new Error(
              "map_interact travel did not update player_location",
            );
          }

          const visitedTravelFlag = [...conn.db.playerFlag.iter()].find(
            (row) =>
              row.playerId.toHexString() === identity.toHexString() &&
              row.key === `VISITED_${ids.pointTravel}` &&
              row.value,
          );
          if (!visitedTravelFlag) {
            throw new Error("map_interact travel did not set VISITED_* flag");
          }

          await conn.reducers.mapInteract({
            requestId: nextRequestId("start"),
            pointId: ids.pointCase,
            bindingId: ids.bindingCaseStart,
            trigger: "card_primary",
          });

          const scenarioSession = [...conn.db.vnSession.iter()].find(
            (row) =>
              row.playerId.toHexString() === identity.toHexString() &&
              row.scenarioId === ids.scenarioCase,
          );
          if (!scenarioSession) {
            throw new Error(
              "map_interact start_scenario did not create vn_session",
            );
          }

          const visitedCaseFlag = [...conn.db.playerFlag.iter()].find(
            (row) =>
              row.playerId.toHexString() === identity.toHexString() &&
              row.key === `VISITED_${ids.pointCase}` &&
              row.value,
          );
          if (!visitedCaseFlag) {
            throw new Error(
              "map_interact start_scenario did not set VISITED_* flag",
            );
          }

          await expectRejected(
            () =>
              conn.reducers.mapInteract({
                requestId: nextRequestId("locked"),
                pointId: ids.pointLocked,
                bindingId: ids.bindingLocked,
                trigger: "card_primary",
              }),
            "conditions_failed",
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
      });

    builder.build();
  });

try {
  await runSmoke();
  console.log("Map authority smoke script passed.");
} catch (error) {
  console.error("Map authority smoke script failed:", error);
  process.exitCode = 1;
}
