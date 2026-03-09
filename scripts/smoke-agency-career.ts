import { DbConnection } from "../src/module_bindings";
import {
  completeAgencyStudentIntro,
  createRequestIdFactory,
  ensureBriefingReady,
  getAgencyCareer,
  getPlayerFlagValue,
  getQuestStage,
  loadPilotSnapshot,
  openAgencyStudentIntro,
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
const nextRequestId = createRequestIdFactory("smoke_agency_career", runId);

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
            "smoke_agency_career",
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
          await openAgencyStudentIntro(conn, nextRequestId);
          await completeAgencyStudentIntro(conn, snapshot, nextRequestId);

          await conn.reducers.setFlag({
            key: "case_banker_theft_solved",
            value: true,
          });
          await conn.reducers.mapInteract({
            requestId: nextRequestId("close_banker_case"),
            pointId: "loc_freiburg_bank",
            bindingId: "bind_bank_close",
            trigger: "card_primary",
          });

          if (getQuestStage(conn, playerHex, "quest_banker") < 3) {
            throw new Error(
              "Banker closure path did not advance quest_banker to stage 3",
            );
          }

          const agencyCareer = getAgencyCareer(conn, playerHex);
          if (!agencyCareer) {
            throw new Error(
              "Agency career row is missing after promotion path",
            );
          }
          if (
            !agencyCareer.rumorCriterionComplete ||
            !agencyCareer.sourceCriterionComplete
          ) {
            throw new Error(
              "Career progression path did not retain both social service criteria",
            );
          }
          if (agencyCareer.rankId !== "junior_detective") {
            throw new Error(
              `Expected junior_detective rank after Freiburg promotion path; got ${agencyCareer.rankId}`,
            );
          }

          await conn.reducers.mapInteract({
            requestId: nextRequestId("open_promotion_review"),
            pointId: "loc_agency",
            bindingId: "bind_agency_promotion_review",
            trigger: "card_secondary",
          });
          await conn.reducers.recordChoice({
            requestId: nextRequestId("confirm_promotion_review"),
            scenarioId: "sandbox_agency_promotion_review",
            choiceId: resolveChoiceId(
              snapshot.nodeById,
              "scene_agency_promotion_review",
              "AGENCY_PROMOTION_REVIEW_CONFIRM",
            ),
          });

          if (
            !getPlayerFlagValue(
              conn,
              playerHex,
              "agency_promotion_review_complete",
            )
          ) {
            throw new Error("Career-rank-gated agency review did not complete");
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
  console.log("Agency career smoke script passed.");
} catch (error) {
  console.error("Agency career smoke script failed:", error);
  process.exitCode = 1;
}
