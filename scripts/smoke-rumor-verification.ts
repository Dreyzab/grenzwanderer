import { DbConnection } from "../src/shared/spacetime/bindings";
import {
  createRequestIdFactory,
  ensureBriefingReady,
  expectRejected,
  getAgencyCareer,
  getFavorBalance,
  getRumorStatus,
  isRumorRegisteredLike,
  loadPilotSnapshot,
  openAgencyStudentIntro,
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
const nextRequestId = createRequestIdFactory("smoke_rumor_verification", runId);

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
            "smoke_rumor_verification",
          );
          await subscribeSocialTables(conn);
          await ensureBriefingReady(conn);

          await expectRejected(
            () => openAgencyStudentIntro(conn, nextRequestId),
            "conditions_failed",
          );

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
              "Workers' Pub route did not leave the rumor in registered state",
            );
          }
          if (getFavorBalance(conn, playerHex, "npc_anna_mahler") < 1) {
            throw new Error(
              "Workers' Pub route did not create Anna favor balance",
            );
          }

          await expectRejected(
            () => openAgencyStudentIntro(conn, nextRequestId),
            "conditions_failed",
          );

          await verifyRailYardRumor(conn, nextRequestId);

          const rumorStatus = getRumorStatus(
            conn,
            playerHex,
            "rumor_bank_rail_yard",
          );
          if (rumorStatus !== "verified") {
            throw new Error(
              `Expected verified rumor state, got ${rumorStatus ?? "null"}`,
            );
          }

          const agencyCareer = getAgencyCareer(conn, playerHex);
          if (!agencyCareer?.rumorCriterionComplete) {
            throw new Error(
              "Verified rumor did not record verified_rumor_chain criterion",
            );
          }
          if (agencyCareer.standingScore < 10) {
            throw new Error(
              `Rumor verification should raise standing to at least 10; got ${agencyCareer.standingScore}`,
            );
          }

          await openAgencyStudentIntro(conn, nextRequestId);

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
  console.log("Rumor verification smoke script passed.");
} catch (error) {
  console.error("Rumor verification smoke script failed:", error);
  process.exitCode = 1;
}
