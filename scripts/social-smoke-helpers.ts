import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DbConnection } from "../src/shared/spacetime/bindings";
import { ensureAdminAccess } from "./spacetime-operator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const snapshotPath = path.join(
  repoRoot,
  "content",
  "vn",
  "pilot.snapshot.json",
);

export interface LoadedPilotSnapshot {
  checksum: string;
  payloadJson: string;
  schemaVersion: number;
  scenarioIds: Set<string>;
  nodeById: Map<
    string,
    {
      id: string;
      scenarioId: string;
      choices: Array<{ id: string }>;
    }
  >;
}

export interface ScenarioStep {
  nodeId: string;
  choiceId: string;
  passiveChecks?: string[];
}

export const loadPilotSnapshot = (): LoadedPilotSnapshot => {
  const payloadJson = readFileSync(snapshotPath, "utf8");
  const parsed = JSON.parse(payloadJson) as {
    checksum?: string;
    schemaVersion?: number;
    scenarios?: Array<{ id: string }>;
    nodes?: Array<{
      id: string;
      scenarioId: string;
      choices: Array<{ id: string }>;
    }>;
  };

  if (typeof parsed.checksum !== "string" || !parsed.checksum) {
    throw new Error("pilot.snapshot.json is missing checksum");
  }
  if (typeof parsed.schemaVersion !== "number") {
    throw new Error("pilot.snapshot.json is missing schemaVersion");
  }
  if (!Array.isArray(parsed.scenarios) || !Array.isArray(parsed.nodes)) {
    throw new Error("pilot.snapshot.json has invalid scenarios/nodes shape");
  }

  return {
    checksum: parsed.checksum,
    payloadJson,
    schemaVersion: parsed.schemaVersion,
    scenarioIds: new Set(parsed.scenarios.map((entry) => entry.id)),
    nodeById: new Map(parsed.nodes.map((entry) => [entry.id, entry])),
  };
};

export const wait = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const createRequestIdFactory = (
  prefix: string,
  runId: string,
): ((suffix: string) => string) => {
  let requestCounter = 0;
  return (suffix: string) => {
    requestCounter += 1;
    return `${prefix}_${runId}_${suffix}_${requestCounter}`;
  };
};

export const resolveChoiceId = (
  nodeById: LoadedPilotSnapshot["nodeById"],
  nodeId: string,
  preferredChoiceId: string,
): string => {
  const node = nodeById.get(nodeId);
  if (!node) {
    throw new Error(`Node ${nodeId} is missing in snapshot`);
  }

  if (node.choices.some((choice) => choice.id === preferredChoiceId)) {
    return preferredChoiceId;
  }
  if (node.choices.length === 1) {
    return node.choices[0]!.id;
  }

  throw new Error(
    `Choice ${preferredChoiceId} is missing for node ${nodeId}; available: ${node.choices.map((choice) => choice.id).join(", ")}`,
  );
};

export const expectRejected = async (
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

export const publishPilotSnapshot = async (
  conn: DbConnection,
  snapshot: LoadedPilotSnapshot,
  nextRequestId: (suffix: string) => string,
  versionPrefix: string,
): Promise<void> => {
  await ensureAdminAccess(conn);
  await conn.reducers.publishContent({
    requestId: nextRequestId("publish"),
    version: `${versionPrefix}_${Date.now()}`,
    checksum: snapshot.checksum,
    schemaVersion: snapshot.schemaVersion,
    payloadJson: snapshot.payloadJson,
  });
};

export const subscribeSocialTables = async (
  conn: DbConnection,
): Promise<void> =>
  new Promise<void>((resolve) => {
    conn
      .subscriptionBuilder()
      .onApplied(() => resolve())
      .subscribe([
        "SELECT * FROM my_player_flags",
        "SELECT * FROM my_unlock_groups",
        "SELECT * FROM my_map_events",
        "SELECT * FROM my_npc_favors",
        "SELECT * FROM my_agency_career",
        "SELECT * FROM my_rumor_state",
        "SELECT * FROM my_quests",
        "SELECT * FROM my_player_location",
        "SELECT * FROM my_vn_sessions",
      ]);
  });

export const startScenarioWithRetry = async (
  conn: DbConnection,
  snapshot: LoadedPilotSnapshot,
  scenarioId: string,
  nextRequestId: (suffix: string) => string,
): Promise<void> => {
  if (!snapshot.scenarioIds.has(scenarioId)) {
    throw new Error(`Scenario ${scenarioId} is missing in snapshot`);
  }

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      await conn.reducers.startScenario({
        requestId: nextRequestId(`start_${scenarioId}`),
        scenarioId,
      });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Unknown scenario") && attempt < 20) {
        await wait(250);
        continue;
      }
      throw error;
    }
  }
};

export const runScenarioPath = async (
  conn: DbConnection,
  snapshot: LoadedPilotSnapshot,
  scenarioId: string,
  steps: ReadonlyArray<ScenarioStep>,
  nextRequestId: (suffix: string) => string,
): Promise<void> => {
  await startScenarioWithRetry(conn, snapshot, scenarioId, nextRequestId);

  for (const step of steps) {
    if (step.passiveChecks) {
      for (const checkId of step.passiveChecks) {
        await conn.reducers.performSkillCheck({
          requestId: nextRequestId(`check_${scenarioId}_${checkId}`),
          scenarioId,
          checkId,
          fortuneSpend: undefined,
        });
      }
    }

    await conn.reducers.recordChoice({
      requestId: nextRequestId(`choice_${scenarioId}_${step.choiceId}`),
      scenarioId,
      choiceId: resolveChoiceId(snapshot.nodeById, step.nodeId, step.choiceId),
    });
  }
};

export const getPlayerFlagValue = (
  conn: DbConnection,
  playerHex: string,
  key: string,
): boolean =>
  [...conn.db.playerFlag.iter()].some(
    (row) =>
      row.playerId.toHexString() === playerHex &&
      row.key === key &&
      row.value === true,
  );

export const getFavorBalance = (
  conn: DbConnection,
  playerHex: string,
  npcId: string,
): number => {
  const row = [...conn.db.playerNpcFavor.iter()].find(
    (entry) =>
      entry.playerId.toHexString() === playerHex && entry.npcId === npcId,
  );
  if (!row) {
    return 0;
  }
  return typeof row.balance === "bigint" ? Number(row.balance) : row.balance;
};

export const getAgencyCareer = (
  conn: DbConnection,
  playerHex: string,
): {
  standingScore: number;
  rankId: string;
  rumorCriterionComplete: boolean;
  sourceCriterionComplete: boolean;
  cleanClosureCriterionComplete: boolean;
} | null => {
  const row = [...conn.db.playerAgencyCareer.iter()].find(
    (entry) => entry.playerId.toHexString() === playerHex,
  );
  if (!row) {
    return null;
  }
  return {
    standingScore: row.standingScore,
    rankId: row.rankId,
    rumorCriterionComplete: row.rumorCriterionComplete,
    sourceCriterionComplete: row.sourceCriterionComplete,
    cleanClosureCriterionComplete: row.cleanClosureCriterionComplete,
  };
};

export const getRumorStatus = (
  conn: DbConnection,
  playerHex: string,
  rumorId: string,
): string | null => {
  const row = [...conn.db.playerRumorState.iter()].find(
    (entry) =>
      entry.playerId.toHexString() === playerHex && entry.rumorId === rumorId,
  );
  return row?.status ?? null;
};

export const hasUnlockGroup = (
  conn: DbConnection,
  playerHex: string,
  groupId: string,
): boolean =>
  [...conn.db.playerUnlockGroup.iter()].some(
    (entry) =>
      entry.playerId.toHexString() === playerHex && entry.groupId === groupId,
  );

export const getQuestStage = (
  conn: DbConnection,
  playerHex: string,
  questId: string,
): number => {
  const row = [...conn.db.playerQuest.iter()].find(
    (entry) =>
      entry.playerId.toHexString() === playerHex && entry.questId === questId,
  );
  return row ? Number(row.stage) : 0;
};

export const getScenarioSession = (
  conn: DbConnection,
  playerHex: string,
  scenarioId: string,
): { scenarioId: string; nodeId: string } | null => {
  const row = [...conn.db.vnSession.iter()].find(
    (entry) =>
      entry.playerId.toHexString() === playerHex &&
      entry.scenarioId === scenarioId,
  );
  return row ? { scenarioId: row.scenarioId, nodeId: row.nodeId } : null;
};

export const getPlayerMapEventByTemplate = async (
  conn: DbConnection,
  playerHex: string,
  templateId: string,
): Promise<{ eventId: string; templateId: string } | null> => {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const row = [...conn.db.playerMapEvent.iter()].find(
      (entry) =>
        entry.playerId.toHexString() === playerHex &&
        entry.templateId === templateId &&
        entry.status === "active",
    );
    if (row) {
      return { eventId: row.eventId, templateId: row.templateId };
    }
    await wait(150);
  }

  return null;
};

export const ensureBriefingReady = async (
  conn: DbConnection,
): Promise<void> => {
  await conn.reducers.setFlag({
    key: "agency_briefing_complete",
    value: true,
  });
  await conn.reducers.setFlag({
    key: "intro_freiburg_done",
    value: true,
  });
  await conn.reducers.setFlag({
    key: "case01_bridge_started",
    value: true,
  });
  await conn.reducers.setFlag({
    key: "banker_case_closed",
    value: false,
  });
  await conn.reducers.setFlag({
    key: "service_anna_student_intro_unlocked",
    value: false,
  });
  await conn.reducers.setFlag({
    key: "agency_promotion_review_complete",
    value: false,
  });
  await conn.reducers.setFlag({
    key: "student_house_accessed",
    value: false,
  });
};

export const registerWorkersPubRumor = async (
  conn: DbConnection,
  snapshot: LoadedPilotSnapshot,
  playerHex: string,
  nextRequestId: (suffix: string) => string,
): Promise<void> => {
  await conn.reducers.mapInteract({
    requestId: nextRequestId("spawn_workers_pub_rumor"),
    pointId: "loc_workers_pub",
    bindingId: "bind_pub_rumor_raid",
    trigger: "card_secondary",
  });

  const activeEvent = await getPlayerMapEventByTemplate(
    conn,
    playerHex,
    "evt_workers_pub_raid",
  );
  if (!activeEvent) {
    throw new Error(
      "Workers' Pub rumor route did not spawn evt_workers_pub_raid",
    );
  }

  await conn.reducers.mapInteract({
    requestId: nextRequestId("open_workers_pub_rumor"),
    pointId: activeEvent.eventId,
    bindingId: "bind_evt_workers_pub_raid_start",
    trigger: "map_pin",
  });

  const session = getScenarioSession(
    conn,
    playerHex,
    "sandbox_workers_pub_rumor",
  );
  if (!session) {
    throw new Error(
      "Workers' Pub rumor map event did not start sandbox_workers_pub_rumor",
    );
  }

  await conn.reducers.recordChoice({
    requestId: nextRequestId("record_workers_pub_rumor"),
    scenarioId: "sandbox_workers_pub_rumor",
    choiceId: resolveChoiceId(
      snapshot.nodeById,
      "scene_workers_pub_rumor",
      "WORKERS_PUB_RUMOR_PURSUE",
    ),
  });
};

export const verifyRailYardRumor = async (
  conn: DbConnection,
  nextRequestId: (suffix: string) => string,
): Promise<void> => {
  await conn.reducers.mapInteract({
    requestId: nextRequestId("verify_rail_yard_rumor"),
    pointId: "loc_hbf",
    bindingId: "bind_hbf_verify_rail_yard_rumor",
    trigger: "card_primary",
  });
};

export const openAgencyStudentIntro = async (
  conn: DbConnection,
  nextRequestId: (suffix: string) => string,
): Promise<void> => {
  await conn.reducers.mapInteract({
    requestId: nextRequestId("open_agency_student_intro"),
    pointId: "loc_agency",
    bindingId: "bind_agency_student_intro_service",
    trigger: "card_secondary",
  });
};

export const completeAgencyStudentIntro = async (
  conn: DbConnection,
  snapshot: LoadedPilotSnapshot,
  nextRequestId: (suffix: string) => string,
): Promise<void> => {
  await conn.reducers.recordChoice({
    requestId: nextRequestId("confirm_agency_student_intro"),
    scenarioId: "sandbox_agency_service_unlock",
    choiceId: resolveChoiceId(
      snapshot.nodeById,
      "scene_agency_service_unlock",
      "AGENCY_SERVICE_UNLOCK_CONFIRM",
    ),
  });
};

export const openStudentHouseAccess = async (
  conn: DbConnection,
  nextRequestId: (suffix: string) => string,
): Promise<void> => {
  await conn.reducers.mapInteract({
    requestId: nextRequestId("open_student_house"),
    pointId: "loc_student_house",
    bindingId: "bind_student_house_access",
    trigger: "card_primary",
  });
};
