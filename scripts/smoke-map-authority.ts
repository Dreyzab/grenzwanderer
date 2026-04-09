import { createHash } from "node:crypto";
import { DbConnection } from "../src/shared/spacetime/bindings";
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

const qrCodes = {
  locationRequired: {
    codeId: `qr_require_location_${runId}`,
    code: `warehouse-loc-${runId}`,
  },
  cooldown: {
    codeId: `qr_geofence_cooldown_${runId}`,
    code: `warehouse-cooldown-${runId}`,
  },
  success: {
    codeId: `qr_geofence_success_${runId}`,
    code: `warehouse-success-${runId}`,
  },
};

const warehouseGeofence = {
  lat: 47.9959,
  lng: 7.8522,
  radiusMeters: 80,
};

const hashCode = (code: string): string =>
  createHash("sha256").update(code, "utf8").digest("hex");

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
    qrCodeRegistry: [
      {
        codeId: qrCodes.locationRequired.codeId,
        codeHash: hashCode(qrCodes.locationRequired.code),
        redeemPolicy: "once_per_player",
        contentClass: "evidence_fragment",
        policyTier: "once_per_player",
        conditions: [{ type: "geofence_within", ...warehouseGeofence }],
        effects: [
          {
            type: "unlock_group",
            groupId: `unlock_${qrCodes.locationRequired.codeId}`,
          },
        ],
      },
      {
        codeId: qrCodes.cooldown.codeId,
        codeHash: hashCode(qrCodes.cooldown.code),
        redeemPolicy: "once_per_player",
        contentClass: "evidence_fragment",
        policyTier: "once_per_player",
        conditions: [{ type: "geofence_within", ...warehouseGeofence }],
        effects: [
          {
            type: "unlock_group",
            groupId: `unlock_${qrCodes.cooldown.codeId}`,
          },
        ],
      },
      {
        codeId: qrCodes.success.codeId,
        codeHash: hashCode(qrCodes.success.code),
        redeemPolicy: "once_per_player",
        contentClass: "evidence_fragment",
        policyTier: "once_per_player",
        conditions: [{ type: "geofence_within", ...warehouseGeofence }],
        effects: [
          {
            type: "unlock_group",
            groupId: `unlock_${qrCodes.success.codeId}`,
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

const findRedeemAttempt = (
  conn: DbConnection,
  codeId: string,
  result: string,
) =>
  [...conn.db.playerRedeemedCode.iter()].find(
    (row) => row.codeId === codeId && row.result === result,
  );

const waitForRedeemAttempt = async (
  conn: DbConnection,
  codeId: string,
  result: string,
) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const row = findRedeemAttempt(conn, codeId, result);
    if (row) {
      return row;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return undefined;
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
                "SELECT * FROM my_player_location",
                "SELECT * FROM my_player_flags",
                "SELECT * FROM my_redeemed_codes",
                "SELECT * FROM my_unlock_groups",
                "SELECT * FROM my_vn_sessions",
              ]);
          });

          await conn.reducers.mapInteract({
            requestId: nextRequestId("travel"),
            pointId: ids.pointTravel,
            bindingId: ids.bindingTravel,
            trigger: "card_secondary",
          });

          const travelLocation = [...conn.db.playerLocation.iter()][0];
          if (
            !travelLocation ||
            travelLocation.locationId !== "loc_map_travel"
          ) {
            throw new Error(
              "map_interact travel did not update player_location",
            );
          }

          const visitedTravelFlag = [...conn.db.playerFlag.iter()].find(
            (row) => row.key === `VISITED_${ids.pointTravel}` && row.value,
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
            (row) => row.scenarioId === ids.scenarioCase,
          );
          if (!scenarioSession) {
            throw new Error(
              "map_interact start_scenario did not create vn_session",
            );
          }

          const visitedCaseFlag = [...conn.db.playerFlag.iter()].find(
            (row) => row.key === `VISITED_${ids.pointCase}` && row.value,
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

          await expectRejected(
            () =>
              conn.reducers.redeemMapCode({
                requestId: nextRequestId("qr_location_required"),
                code: qrCodes.locationRequired.code,
                attemptedFromLat: undefined,
                attemptedFromLng: undefined,
              }),
            "code_location_required",
          );

          await new Promise((resolve) => setTimeout(resolve, 100));
          if (
            findRedeemAttempt(
              conn,
              qrCodes.locationRequired.codeId,
              "location_required",
            )
          ) {
            throw new Error(
              "redeem_map_code unexpectedly persisted a rejected location_required attempt",
            );
          }

          await expectRejected(
            () =>
              conn.reducers.redeemMapCode({
                requestId: nextRequestId("qr_outside_geofence"),
                code: qrCodes.cooldown.code,
                attemptedFromLat: warehouseGeofence.lat + 0.02,
                attemptedFromLng: warehouseGeofence.lng + 0.02,
              }),
            "code_outside_geofence",
          );

          await new Promise((resolve) => setTimeout(resolve, 100));
          if (
            findRedeemAttempt(
              conn,
              qrCodes.cooldown.codeId,
              "outside_geofence",
            )
          ) {
            throw new Error(
              "redeem_map_code unexpectedly persisted a rejected outside_geofence attempt",
            );
          }

          await conn.reducers.redeemMapCode({
            requestId: nextRequestId("qr_success"),
            code: qrCodes.success.code,
            attemptedFromLat: warehouseGeofence.lat,
            attemptedFromLng: warehouseGeofence.lng,
          });

          const successAttempt = await waitForRedeemAttempt(
            conn,
            qrCodes.success.codeId,
            "applied",
          );
          if (!successAttempt) {
            throw new Error(
              "redeem_map_code did not persist the applied result",
            );
          }

          const unlockedGroup = [...conn.db.playerUnlockGroup.iter()].find(
            (row) => row.groupId === `unlock_${qrCodes.success.codeId}`,
          );
          if (!unlockedGroup) {
            throw new Error(
              "redeem_map_code did not apply unlock_group after in-range redemption",
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
  console.log("Map authority smoke script passed.");
} catch (error) {
  console.error("Map authority smoke script failed:", error);
  process.exitCode = 1;
}
