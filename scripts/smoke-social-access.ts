import { DbConnection } from "../src/shared/spacetime/bindings";
import {
  completeAgencyStudentIntro,
  createRequestIdFactory,
  ensureBriefingReady,
  getAgencyCareer,
  getPlayerFlagValue,
  hasMindFact,
  getRumorStatus,
  isRumorRegisteredLike,
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
      .onConnect(async (conn) => {
        try {
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
            !isRumorRegisteredLike(
              getRumorStatus(conn, playerHex, "rumor_bank_rail_yard"),
            )
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
          if (
            !hasMindFact(conn, playerHex, "fact_student_house_channel_opened")
          ) {
            throw new Error(
              "Student house VN path did not discover the student-house channel fact",
            );
          }

          // Freiburg depth: favor with Rudi Kempf + any map interaction lets
          // trig.freiburg.pub_backroom open the Red Cog back room.
          await conn.reducers.changeFavorBalance({
            requestId: nextRequestId("grant_rudi_favor"),
            npcId: "npc_rudi_kempf",
            delta: 1,
            reason: "smoke_backroom_setup",
          });
          await conn.reducers.mapInteract({
            requestId: nextRequestId("pub_presence"),
            pointId: "loc_workers_pub",
            bindingId: "sys_travel_loc_workers_pub",
            trigger: "card_secondary",
            attemptedFromLat: undefined,
            attemptedFromLng: undefined,
          });
          if (!getPlayerFlagValue(conn, playerHex, "pub_backroom_access")) {
            throw new Error(
              "map.interacted trigger did not unlock the pub back room",
            );
          }
          await conn.reducers.mapInteract({
            requestId: nextRequestId("enter_backroom"),
            pointId: "loc_workers_pub",
            bindingId: "bind_pub_backroom",
            trigger: "card_primary",
            attemptedFromLat: undefined,
            attemptedFromLng: undefined,
          });
          if (!getPlayerFlagValue(conn, playerHex, "pub_backroom_visited")) {
            throw new Error("Back room interaction did not complete");
          }
          if (
            !isRumorRegisteredLike(
              getRumorStatus(conn, playerHex, "rumor_sapper_clean_cut"),
            )
          ) {
            throw new Error(
              "Back room interaction did not register the sapper rumor",
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
