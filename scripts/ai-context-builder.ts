import {
  AI_GENERATE_DIALOGUE_KIND,
  parseGenerateDialoguePayload,
  parseGenerateDialogueResponse,
  type GenerateDialoguePayload,
} from "../src/features/ai/contracts";
import {
  getOriginProfileByFlags,
  getParliamentPresetForOrigin,
  getSelectedOriginTrack,
  type OriginParliamentPresetId,
} from "../src/features/character/originProfiles";
import { buildMysticStateSummary } from "../src/features/mysticism/model/mysticism";
import {
  getNodeById,
  getScenarioById,
  parseSnapshot,
} from "../src/features/vn/vnContent";
import { findActiveHypothesisLens } from "../src/features/mindpalace/focusLens";
import type { QuestCatalogEntry, VnSnapshot } from "../src/features/vn/types";

type FetchLike = typeof fetch;

const DEFAULT_RECENT_DIALOGUE_FETCH_LIMIT = 12;
const DEFAULT_MAX_RECENT_DIALOGUE_LINES = 4;
const DEFAULT_STALE_THRESHOLD_HOURS = 24;

export interface PlayerScopedAiJob {
  playerId: string;
}

export interface SceneContext {
  sceneSnapshot: string;
  recentDialogue: string[];
  activeQuestSummary: string;
  originProfileId?: string;
  originLabel?: string;
  selectedTrackId?: string;
  selectedTrackTitle?: string;
  parliamentPresetId?: OriginParliamentPresetId;
  routeStep?: string;
  occultExposure?: string;
}

export interface BuildSceneContextOptions {
  fetchImpl?: FetchLike;
  host: string;
  database: string;
  token: string;
  staleThresholdHours?: number;
}

interface RecentDialogueRow {
  payloadJson: string;
  responseJson: string | null;
  updatedAt: string;
}

interface PlayerQuestRow {
  questId: string;
  stage: number;
}

interface PlayerFlagRow {
  key: string;
  value: boolean;
}

interface PlayerVarRow {
  key: string;
  floatValue: number;
}

interface ActiveSnapshotRow {
  checksum: string;
  payloadJson: string;
}

const escapeSqlLiteral = (value: string): string => value.replace(/'/g, "''");

const coerceString = (value: unknown, fieldName: string): string => {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  throw new Error(`Invalid ${fieldName}`);
};

const coerceNullableString = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }
  return typeof value === "string" ? value : String(value);
};

const coerceNumber = (value: unknown, fieldName: string): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  throw new Error(`Invalid ${fieldName}`);
};

const coerceBoolean = (value: unknown, fieldName: string): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") {
      return true;
    }
    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }
  throw new Error(`Invalid ${fieldName}`);
};

const httpHostFromWorkerHost = (host: string): string =>
  host.replace("ws://", "http://").replace("wss://", "https://");

const fetchSqlRows = async (
  host: string,
  database: string,
  token: string,
  query: string,
  fetchImpl: FetchLike,
): Promise<unknown[]> => {
  const response = await fetchImpl(
    `${httpHostFromWorkerHost(host)}/v1/database/${database}/sql`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: query,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed SQL request: ${response.status} ${response.statusText}`,
    );
  }

  const rows = (await response.json()) as unknown;
  return Array.isArray(rows) ? rows : [];
};

export const buildRecentDialogueQuery = (
  playerId: string,
  limit: number = DEFAULT_RECENT_DIALOGUE_FETCH_LIMIT,
): string => {
  const escapedPlayerId = escapeSqlLiteral(playerId);
  return [
    "SELECT",
    "  payload_json,",
    "  response_json,",
    "  updated_at",
    "FROM ai_request",
    `WHERE player_id = '${escapedPlayerId}'`,
    `  AND kind = '${AI_GENERATE_DIALOGUE_KIND}'`,
    "  AND status = 'completed'",
    "ORDER BY updated_at DESC",
    `LIMIT ${limit}`,
  ].join("\n");
};

export const buildPlayerQuestQuery = (playerId: string): string => {
  const escapedPlayerId = escapeSqlLiteral(playerId);
  return [
    "SELECT",
    "  quest_id,",
    "  stage",
    "FROM player_quest",
    `WHERE player_id = '${escapedPlayerId}'`,
    "ORDER BY updated_at DESC",
  ].join("\n");
};

export const buildPlayerFlagQuery = (playerId: string): string => {
  const escapedPlayerId = escapeSqlLiteral(playerId);
  return [
    "SELECT",
    "  key,",
    "  value",
    "FROM player_flag",
    `WHERE player_id = '${escapedPlayerId}'`,
    "ORDER BY updated_at DESC",
  ].join("\n");
};

export const buildPlayerVarQuery = (playerId: string): string => {
  const escapedPlayerId = escapeSqlLiteral(playerId);
  return [
    "SELECT",
    "  key,",
    "  float_value",
    "FROM player_var",
    `WHERE player_id = '${escapedPlayerId}'`,
    "ORDER BY updated_at DESC",
  ].join("\n");
};

export const buildActiveSnapshotQuery = (): string =>
  [
    "SELECT",
    "  cs.checksum,",
    "  cs.payload_json",
    "FROM content_snapshot cs",
    "JOIN content_version cv ON cv.checksum = cs.checksum",
    "WHERE cv.is_active = true",
    "LIMIT 1",
  ].join("\n");

const parseRecentDialogueRow = (row: unknown): RecentDialogueRow => {
  if (Array.isArray(row)) {
    if (row.length < 3) {
      throw new Error("Recent dialogue SQL row is missing columns");
    }
    return {
      payloadJson: coerceString(row[0], "payload_json"),
      responseJson: coerceNullableString(row[1]),
      updatedAt: coerceString(row[2], "updated_at"),
    };
  }

  if (typeof row === "object" && row !== null) {
    const record = row as Record<string, unknown>;
    return {
      payloadJson: coerceString(
        record.payload_json ?? record.payloadJson,
        "payload_json",
      ),
      responseJson: coerceNullableString(
        record.response_json ?? record.responseJson,
      ),
      updatedAt: coerceString(
        record.updated_at ?? record.updatedAt,
        "updated_at",
      ),
    };
  }

  throw new Error("Unsupported recent dialogue row shape");
};

const parsePlayerQuestRow = (row: unknown): PlayerQuestRow => {
  if (Array.isArray(row)) {
    if (row.length < 2) {
      throw new Error("Player quest SQL row is missing columns");
    }
    return {
      questId: coerceString(row[0], "quest_id"),
      stage: coerceNumber(row[1], "stage"),
    };
  }

  if (typeof row === "object" && row !== null) {
    const record = row as Record<string, unknown>;
    return {
      questId: coerceString(record.quest_id ?? record.questId, "quest_id"),
      stage: coerceNumber(record.stage, "stage"),
    };
  }

  throw new Error("Unsupported player quest row shape");
};

const parsePlayerFlagRow = (row: unknown): PlayerFlagRow => {
  if (Array.isArray(row)) {
    if (row.length < 2) {
      throw new Error("Player flag SQL row is missing columns");
    }
    return {
      key: coerceString(row[0], "key"),
      value: coerceBoolean(row[1], "value"),
    };
  }

  if (typeof row === "object" && row !== null) {
    const record = row as Record<string, unknown>;
    return {
      key: coerceString(record.key, "key"),
      value: coerceBoolean(record.value, "value"),
    };
  }

  throw new Error("Unsupported player flag row shape");
};

const parseActiveSnapshotRow = (row: unknown): ActiveSnapshotRow => {
  if (Array.isArray(row)) {
    if (row.length < 2) {
      throw new Error("Active snapshot SQL row is missing columns");
    }
    return {
      checksum: coerceString(row[0], "checksum"),
      payloadJson: coerceString(row[1], "payload_json"),
    };
  }

  if (typeof row === "object" && row !== null) {
    const record = row as Record<string, unknown>;
    return {
      checksum: coerceString(record.checksum, "checksum"),
      payloadJson: coerceString(
        record.payload_json ?? record.payloadJson,
        "payload_json",
      ),
    };
  }

  throw new Error("Unsupported active snapshot row shape");
};

const parsePlayerVarRow = (row: unknown): PlayerVarRow => {
  if (Array.isArray(row)) {
    if (row.length < 2) {
      throw new Error("Player var SQL row is missing columns");
    }
    return {
      key: coerceString(row[0], "key"),
      floatValue: coerceNumber(row[1], "float_value"),
    };
  }

  if (typeof row === "object" && row !== null) {
    const record = row as Record<string, unknown>;
    return {
      key: coerceString(record.key, "key"),
      floatValue: coerceNumber(
        record.float_value ?? record.floatValue,
        "float_value",
      ),
    };
  }

  throw new Error("Unsupported player var row shape");
};

const normalizeLookupKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");

const resolveScenePointIds = (
  snapshot: VnSnapshot,
  payload: GenerateDialoguePayload,
): string[] => {
  if (!snapshot.map) {
    return [];
  }

  const normalizedLocationName = normalizeLookupKey(payload.locationName);
  const pointIds = new Set<string>();

  for (const point of snapshot.map.points) {
    const pointTitleMatches =
      normalizeLookupKey(point.title) === normalizedLocationName;
    const scenarioMatches = point.bindings.some((binding) =>
      binding.actions.some((action) => {
        if (action.type === "start_scenario") {
          return action.scenarioId === payload.scenarioId;
        }
        if (action.type === "open_command_mode") {
          return action.scenarioId === payload.scenarioId;
        }
        if (action.type === "open_battle_mode") {
          return action.scenarioId === payload.scenarioId;
        }
        return false;
      }),
    );

    if (pointTitleMatches || scenarioMatches) {
      pointIds.add(point.id);
    }
  }

  return [...pointIds];
};

const buildSceneSnapshot = (
  payload: GenerateDialoguePayload,
  snapshot: VnSnapshot | null,
  sceneContext?: {
    originLabel?: string;
    selectedTrackTitle?: string;
    parliamentPresetId?: OriginParliamentPresetId;
    occultRouteStatus?: string;
    routeStep?: string;
    occultExposure?: string;
    activeHypothesisLabel?: string;
  },
): string => {
  const scenario = snapshot
    ? getScenarioById(snapshot, payload.scenarioId)
    : null;
  const node = snapshot ? getNodeById(snapshot, payload.nodeId) : null;
  const outcome = payload.passed ? "success" : "failure";
  const parts = [
    `Scenario: ${scenario?.title ?? payload.scenarioId}`,
    `Node: ${node?.title ?? payload.nodeId}`,
    `Location: ${payload.locationName}`,
    `Speaker: ${payload.characterName?.trim() || "Narrator"}`,
    `Outcome: ${outcome}`,
  ];

  if (node?.characterId) {
    parts.push(`Character ID: ${node.characterId}`);
  }
  if (sceneContext?.originLabel) {
    parts.push(`Origin: ${sceneContext.originLabel}`);
  }
  if (sceneContext?.selectedTrackTitle) {
    parts.push(`Specialization: ${sceneContext.selectedTrackTitle}`);
  }
  if (sceneContext?.parliamentPresetId) {
    parts.push(`Parliament preset: ${sceneContext.parliamentPresetId}`);
  }
  if (sceneContext?.occultRouteStatus) {
    parts.push(`Hidden-layer status: ${sceneContext.occultRouteStatus}`);
  }
  if (sceneContext?.routeStep) {
    parts.push(`Route step: ${sceneContext.routeStep}`);
  }
  if (sceneContext?.occultExposure) {
    parts.push(`Occult exposure: ${sceneContext.occultExposure}`);
  }
  if (sceneContext?.activeHypothesisLabel) {
    parts.push(`Active hypothesis: ${sceneContext.activeHypothesisLabel}`);
  }

  return parts.join(". ");
};

const summarizeOccultRouteStatus = (
  flags: Readonly<Record<string, boolean>>,
): string | undefined => {
  if (flags.case01_occult_resolved) {
    return "resolved";
  }
  if (flags.case01_occult_conclusion_entry_pending) {
    return "ready to name the pattern";
  }
  if (flags.case01_occult_telegraph_done) {
    return "switchboard echo logged";
  }
  if (flags.case01_occult_telegraph_entry_pending) {
    return "telegraph follow-up pending";
  }
  if (flags.case01_occult_archive_done) {
    return "archive suppression logged";
  }
  if (flags.case01_occult_archive_entry_pending) {
    return "archive verification pending";
  }
  if (flags.case01_occult_bank_done) {
    return "bank anomaly logged";
  }
  if (flags.case01_occult_bank_entry_pending) {
    return "bank anomaly pending";
  }
  if (flags.case01_occult_started) {
    return "hidden route active";
  }
  return undefined;
};

const summarizeRouteStep = (
  payload: GenerateDialoguePayload,
  flags: Readonly<Record<string, boolean>>,
): string | undefined => {
  if (
    payload.scenarioId === "sandbox_case01_pilot" &&
    payload.nodeId === "scene_case01_occult_bank_interlude"
  ) {
    return "bank focus interlude";
  }
  if (
    payload.scenarioId === "sandbox_case01_pilot" &&
    payload.nodeId === "scene_case01_occult_bank_entry"
  ) {
    return "bank anomaly";
  }
  if (
    payload.scenarioId === "sandbox_case01_pilot" &&
    payload.nodeId.startsWith("scene_case01_occult_bank_exit")
  ) {
    return "bank follow-up locked in";
  }
  if (
    payload.scenarioId === "sandbox_case01_pilot" &&
    payload.nodeId === "scene_case01_occult_archive_entry"
  ) {
    return "archive verification";
  }
  if (
    payload.scenarioId === "sandbox_case01_pilot" &&
    payload.nodeId === "scene_case01_occult_telegraph_entry"
  ) {
    return "telegraph echo";
  }
  if (
    payload.scenarioId === "sandbox_case01_pilot" &&
    payload.nodeId === "scene_case01_occult_conclusion"
  ) {
    return "naming the pattern";
  }

  if (flags.case01_occult_conclusion_entry_pending) {
    return "naming the pattern";
  }
  if (
    flags.case01_occult_telegraph_done ||
    flags.case01_occult_telegraph_entry_pending
  ) {
    return "telegraph echo";
  }
  if (
    flags.case01_occult_archive_done ||
    flags.case01_occult_archive_entry_pending
  ) {
    return "archive verification";
  }
  if (flags.case01_occult_bank_done || flags.case01_occult_bank_entry_pending) {
    return "bank anomaly";
  }

  return summarizeOccultRouteStatus(flags);
};

const summarizeOccultExposure = (
  vars: Readonly<Record<string, number>>,
): string | undefined => {
  const summary = buildMysticStateSummary({ ...vars });
  const hasSignal =
    summary.awakeningLevel > 0 ||
    summary.mysticExposure > 0 ||
    summary.activeSightMode !== "rational";

  if (!hasSignal) {
    return undefined;
  }

  return [
    `Awakening ${summary.awakeningBandLabel.toLowerCase()} (${summary.awakeningLevel}/100)`,
    `exposure ${summary.mysticExposure}`,
    `sight ${summary.activeSightMode}`,
  ].join(", ");
};

const isFreshEnough = (
  updatedAt: string,
  staleThresholdHours: number,
): boolean => {
  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return Date.now() - timestamp <= staleThresholdHours * 60 * 60 * 1_000;
};

const selectRecentDialogue = (
  rows: readonly RecentDialogueRow[],
  payload: GenerateDialoguePayload,
  staleThresholdHours: number,
): string[] => {
  const recentDialogue: string[] = [];

  for (const row of rows) {
    if (!isFreshEnough(row.updatedAt, staleThresholdHours)) {
      continue;
    }

    const candidatePayload = parseGenerateDialoguePayload(row.payloadJson);
    if (
      !candidatePayload ||
      candidatePayload.scenarioId !== payload.scenarioId
    ) {
      continue;
    }

    const candidateResponse = parseGenerateDialogueResponse(row.responseJson);
    if (!candidateResponse) {
      continue;
    }

    recentDialogue.push(candidateResponse.text);
    if (recentDialogue.length >= DEFAULT_MAX_RECENT_DIALOGUE_LINES) {
      break;
    }
  }

  return recentDialogue;
};

const getQuestStageSummary = (
  quest: QuestCatalogEntry,
  stageNumber: number,
): {
  title: string;
  objectiveHint: string;
  objectivePointIds: string[];
} | null => {
  const stage =
    quest.stages.find((entry) => entry.stage === stageNumber) ??
    [...quest.stages]
      .sort((left, right) => right.stage - left.stage)
      .find((entry) => entry.stage <= stageNumber) ??
    null;

  if (!stage) {
    return null;
  }

  return {
    title: stage.title,
    objectiveHint: stage.objectiveHint,
    objectivePointIds: stage.objectivePointIds ?? [],
  };
};

const summarizeActiveQuests = (
  snapshot: VnSnapshot,
  payload: GenerateDialoguePayload,
  questRows: readonly PlayerQuestRow[],
): string => {
  if (!snapshot.questCatalog || snapshot.questCatalog.length === 0) {
    return "";
  }

  const scenePointIds = resolveScenePointIds(snapshot, payload);
  if (scenePointIds.length === 0) {
    return "";
  }

  const scenePointIdSet = new Set(scenePointIds);
  const matchedSummaries: string[] = [];

  for (const row of questRows) {
    const quest = snapshot.questCatalog.find(
      (entry) => entry.id === row.questId,
    );
    if (!quest) {
      continue;
    }

    const stageSummary = getQuestStageSummary(quest, row.stage);
    if (!stageSummary) {
      continue;
    }

    const overlaps = stageSummary.objectivePointIds.some((pointId) =>
      scenePointIdSet.has(pointId),
    );
    if (!overlaps) {
      continue;
    }

    matchedSummaries.push(
      `${quest.title} - ${stageSummary.title}: ${stageSummary.objectiveHint}`,
    );
  }

  return matchedSummaries.join(" | ");
};

const logRetrievalFailure = (scope: string, error: unknown): void => {
  console.warn(
    `[ai-context-builder] ${scope} failed:`,
    error instanceof Error ? error.message : error,
  );
};

const fetchRecentDialogueRows = async (
  playerId: string,
  options: BuildSceneContextOptions,
): Promise<RecentDialogueRow[]> => {
  const rows = await fetchSqlRows(
    options.host,
    options.database,
    options.token,
    buildRecentDialogueQuery(playerId),
    options.fetchImpl ?? fetch,
  );
  return rows.map(parseRecentDialogueRow);
};

const fetchPlayerQuestRows = async (
  playerId: string,
  options: BuildSceneContextOptions,
): Promise<PlayerQuestRow[]> => {
  const rows = await fetchSqlRows(
    options.host,
    options.database,
    options.token,
    buildPlayerQuestQuery(playerId),
    options.fetchImpl ?? fetch,
  );
  return rows.map(parsePlayerQuestRow);
};

const fetchPlayerFlagRows = async (
  playerId: string,
  options: BuildSceneContextOptions,
): Promise<PlayerFlagRow[]> => {
  const rows = await fetchSqlRows(
    options.host,
    options.database,
    options.token,
    buildPlayerFlagQuery(playerId),
    options.fetchImpl ?? fetch,
  );
  return rows.map(parsePlayerFlagRow);
};

const fetchPlayerVarRows = async (
  playerId: string,
  options: BuildSceneContextOptions,
): Promise<PlayerVarRow[]> => {
  const rows = await fetchSqlRows(
    options.host,
    options.database,
    options.token,
    buildPlayerVarQuery(playerId),
    options.fetchImpl ?? fetch,
  );
  return rows.map(parsePlayerVarRow);
};

const fetchActiveSnapshot = async (
  options: BuildSceneContextOptions,
): Promise<VnSnapshot | null> => {
  const rows = await fetchSqlRows(
    options.host,
    options.database,
    options.token,
    buildActiveSnapshotQuery(),
    options.fetchImpl ?? fetch,
  );
  const firstRow = rows[0];
  if (!firstRow) {
    return null;
  }

  const parsedRow = parseActiveSnapshotRow(firstRow);
  return parseSnapshot(parsedRow.payloadJson);
};

export const buildSceneContext = async (
  job: PlayerScopedAiJob,
  payload: GenerateDialoguePayload,
  options: BuildSceneContextOptions,
): Promise<SceneContext> => {
  const staleThresholdHours =
    options.staleThresholdHours ?? DEFAULT_STALE_THRESHOLD_HOURS;

  const [
    recentDialogueResult,
    playerQuestResult,
    playerFlagResult,
    playerVarResult,
    snapshotResult,
  ] = await Promise.allSettled([
    fetchRecentDialogueRows(job.playerId, options),
    fetchPlayerQuestRows(job.playerId, options),
    fetchPlayerFlagRows(job.playerId, options),
    fetchPlayerVarRows(job.playerId, options),
    fetchActiveSnapshot(options),
  ]);

  if (recentDialogueResult.status === "rejected") {
    logRetrievalFailure(
      "recent dialogue retrieval",
      recentDialogueResult.reason,
    );
  }
  if (playerQuestResult.status === "rejected") {
    logRetrievalFailure("player quest retrieval", playerQuestResult.reason);
  }
  if (playerFlagResult.status === "rejected") {
    logRetrievalFailure("player flag retrieval", playerFlagResult.reason);
  }
  if (playerVarResult.status === "rejected") {
    logRetrievalFailure("player var retrieval", playerVarResult.reason);
  }
  if (snapshotResult.status === "rejected") {
    logRetrievalFailure("active snapshot retrieval", snapshotResult.reason);
  }

  const snapshot =
    snapshotResult.status === "fulfilled" ? snapshotResult.value : null;
  const flags =
    playerFlagResult.status === "fulfilled"
      ? Object.fromEntries(
          playerFlagResult.value.map((row) => [row.key, row.value]),
        )
      : {};
  const vars =
    playerVarResult.status === "fulfilled"
      ? Object.fromEntries(
          playerVarResult.value.map((row) => [row.key, row.floatValue]),
        )
      : {};
  const activeOrigin = getOriginProfileByFlags(flags);
  const selectedTrack = activeOrigin
    ? getSelectedOriginTrack(activeOrigin, flags)
    : null;
  const parliamentPresetId = activeOrigin
    ? getParliamentPresetForOrigin(activeOrigin, selectedTrack)
    : undefined;
  const occultRouteStatus = summarizeOccultRouteStatus(flags);
  const routeStep = summarizeRouteStep(payload, flags);
  const occultExposure = summarizeOccultExposure(vars);
  const activeHypothesis = findActiveHypothesisLens(snapshot, flags, [
    "case_hidden_signals",
  ]);
  const recentDialogue =
    recentDialogueResult.status === "fulfilled"
      ? selectRecentDialogue(
          recentDialogueResult.value,
          payload,
          staleThresholdHours,
        )
      : [];
  const activeQuestSummary =
    playerQuestResult.status === "fulfilled" && snapshot
      ? summarizeActiveQuests(snapshot, payload, playerQuestResult.value)
      : "";

  return {
    sceneSnapshot: buildSceneSnapshot(payload, snapshot, {
      originLabel: activeOrigin?.label,
      selectedTrackTitle: selectedTrack?.title,
      parliamentPresetId,
      occultRouteStatus,
      routeStep,
      occultExposure,
      activeHypothesisLabel: activeHypothesis
        ? `${activeHypothesis.caseTitle} -> ${activeHypothesis.hypothesisText}`
        : undefined,
    }),
    recentDialogue,
    activeQuestSummary,
    originProfileId: activeOrigin?.id,
    originLabel: activeOrigin?.label,
    selectedTrackId: selectedTrack?.id,
    selectedTrackTitle: selectedTrack?.title,
    parliamentPresetId,
    routeStep,
    occultExposure,
  };
};
