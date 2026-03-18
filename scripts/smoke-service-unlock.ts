import { DbConnection } from "../src/shared/spacetime/bindings";
import {
  completeAgencyStudentIntro,
  createRequestIdFactory,
  ensureBriefingReady,
  expectRejected,
  getAgencyCareer,
  getPlayerFlagValue,
  hasUnlockGroup,
  loadPilotSnapshot,
  openAgencyStudentIntro,
  openStudentHouseAccess,
  publishPilotSnapshot,
  registerWorkersPubRumor,
  subscribeSocialTables,
  verifyRailYardRumor,
} from "./social-smoke-helpers";
import { getOperatorToken, persistOperatorToken } from "./spacetime-operator";

const host = process.env.SMOKE_STDB_HOST ?? "ws://127.0.0.1:3000";
const database = process.env.SMOKE_STDB_DB ?? "grezwandererdata";
const runId = String(Date.now());
const snapshot = loadPilotSnapshot();
const nextRequestId = createRequestIdFactory("smoke_service_unlock", runId);

const runSmoke = async () =>
  new Promise<void>((resolve, reject) => {
    let finished = false;

    DbConnection.builder()
      .withUri(host)
      .withDatabaseName(database)
      .withToken(getOperatorToken(host, database))
      .onConnect(async (conn, _identity, token) => {
        try {
          persistOperatorToken(host, database, token);
          const identity = conn.identity;
          if (!identity) {
            throw new Error("Missing connection identity");
          }

          const playerHex = identity.toHexString();
          await publishPilotSnapshot(
            conn,
            snapshot,
            nextRequestId,
            "smoke_service_unlock",
          );
          await subscribeSocialTables(conn);
          await ensureBriefingReady(conn);

          await registerWorkersPubRumor(
            conn,
            snapshot,
            playerHex,
            nextRequestId,
          );
          await verifyRailYardRumor(conn, nextRequestId);

          await expectRejected(
            () => openStudentHouseAccess(conn, nextRequestId),
            "point_not_visible",
          );

          await openAgencyStudentIntro(conn, nextRequestId);
          await completeAgencyStudentIntro(conn, snapshot, nextRequestId);

          if (
            !getPlayerFlagValue(
              conn,
              playerHex,
              "service_anna_student_intro_unlocked",
            )
          ) {
            throw new Error(
              "Service unlock did not set service_anna_student_intro_unlocked",
            );
          }
          if (!hasUnlockGroup(conn, playerHex, "loc_student_house")) {
            throw new Error(
              "Service unlock did not write loc_student_house unlock group",
            );
          }

          const agencyCareer = getAgencyCareer(conn, playerHex);
          if (!agencyCareer?.sourceCriterionComplete) {
            throw new Error(
              "Service unlock did not record preserved_source_network",
            );
          }

          await openStudentHouseAccess(conn, nextRequestId);

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

try {
  await runSmoke();
  console.log("Service unlock smoke script passed.");
} catch (error) {
  console.error("Service unlock smoke script failed:", error);
  process.exitCode = 1;
}
