import { DbConnection } from "../src/shared/spacetime/bindings";
import {
  completeAgencyStudentIntro,
  createRequestIdFactory,
  ensureBriefingReady,
  getAgencyCareer,
  getPlayerFlagValue,
  getRumorStatus,
  hasUnlockGroup,
  loadPilotSnapshot,
  openAgencyStudentIntro,
  openStudentHouseAccess,
  publishPilotSnapshot,
  registerWorkersPubRumor,
  resolveChoiceId,
  subscribeSocialTables,
  verifyRailYardRumor,
} from "./social-smoke-helpers";
import { getOperatorToken, persistOperatorToken } from "./spacetime-operator";

const host = process.env.SMOKE_STDB_HOST ?? "ws://127.0.0.1:3000";
const database = process.env.SMOKE_STDB_DB ?? "grezwandererdata";
const runId = String(Date.now());
const snapshot = loadPilotSnapshot();
const nextRequestId = createRequestIdFactory("smoke_social_access", runId);

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
            "smoke_social_access",
          );
          await subscribeSocialTables(conn);
          await ensureBriefingReady(conn);

          await registerWorkersPubRumor(
            conn,
            snapshot,
            playerHex,
            nextRequestId,
          );
          if (
            getRumorStatus(conn, playerHex, "rumor_bank_rail_yard") !==
            "registered"
          ) {
            throw new Error(
              "Workers' Pub route did not register rumor_bank_rail_yard",
            );
          }

          await verifyRailYardRumor(conn, nextRequestId);
          if (
            getRumorStatus(conn, playerHex, "rumor_bank_rail_yard") !==
            "verified"
          ) {
            throw new Error(
              "Freiburg follow-up did not verify rumor_bank_rail_yard",
            );
          }

          await openAgencyStudentIntro(conn, nextRequestId);
          await completeAgencyStudentIntro(conn, snapshot, nextRequestId);

          if (!hasUnlockGroup(conn, playerHex, "loc_student_house")) {
            throw new Error("Anna's service did not unlock loc_student_house");
          }

          const standingAfterService =
            getAgencyCareer(conn, playerHex)?.standingScore ?? 0;
          if (standingAfterService < 15) {
            throw new Error(
              `Student house social access requires standing 15; got ${standingAfterService}`,
            );
          }

          await openStudentHouseAccess(conn, nextRequestId);
          await conn.reducers.recordChoice({
            requestId: nextRequestId("confirm_student_house_access"),
            scenarioId: "sandbox_student_house_access",
            choiceId: resolveChoiceId(
              snapshot.nodeById,
              "scene_student_house_access",
              "STUDENT_HOUSE_PRESENT_INTRODUCTION",
            ),
          });

          if (!getPlayerFlagValue(conn, playerHex, "student_house_accessed")) {
            throw new Error(
              "Student house VN path did not set student_house_accessed",
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

try {
  await runSmoke();
  console.log("Social access smoke script passed.");
} catch (error) {
  console.error("Social access smoke script failed:", error);
  process.exitCode = 1;
}
