import {
  AI_GENERATE_DIALOGUE_KIND,
  parseGenerateDialoguePayload,
  parseGenerateDialogueResponse,
  type GenerateDialoguePayload,
} from "../src/features/ai/contracts";
import {
  buildCanonicalVoicePromptBrief,
  buildParliamentPromptStack,
  canonicalSkillVoiceIdFor,
  canonicalizeSpeakerIds,
  getCanonicalVoiceLabel,
} from "../data/voiceBridge";
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
import {
  NARRATIVE_RESOURCE_DEFAULTS,
  RESOURCE_FORTUNE_MOD_VAR,
  RESOURCE_FORTUNE_VAR,
  RESOURCE_KARMA_VAR,
  RESOURCE_PROVIDENCE_VAR,
  resolveEffectiveFortune,
  resolveKarmaBand,
} from "../src/shared/game/narrativeResources";
import { CASE_CATALOG } from "../src/shared/vn-contract";
import type { QuestCatalogEntry, VnSnapshot } from "../src/features/vn/types";
import {
  escapeSqlLiteral,
  runSpacetimeSql,
  type FetchLike,
} from "./spacetime-sql";

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
  activePoi?: string;
  districtState?: string;
  resourceProfile?: string;
  pendingRumors?: string;
  branchOpportunities?: string;
  proceduralBudget?: string;
  visualStateHints?: string;
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

interface PlayerRumorStateRow {
  rumorId: string;
  status: string;
  leadPointId: string | null;
  caseId: string;
}

interface ActiveSnapshotRow {
  checksum: string;
  payloadJson: string;
}

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

export const buildRecentDialogueQuery = (
  playerId: string,
  limit: number = DEFAULT_RECENT_DIALOGUE_FETCH_LIMIT,
): string => {
  const escapedPlayerId = escapeSqlLiteral(playerId);
  void limit;
  return [
    "SELECT",
    "  payload_json,",
    "  response_json,",
    "  updated_at",
    "FROM ai_request",
    `WHERE player_id = '${escapedPlayerId}'`,
    `  AND kind = '${AI_GENERATE_DIALOGUE_KIND}'`,
    "  AND status = 'completed'",
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
  ].join("\n");
};

export const buildPlayerRumorStateQuery = (playerId: string): string => {
  const escapedPlayerId = escapeSqlLiteral(playerId);
  return [
    "SELECT",
    "  rumor_id,",
    "  status,",
    "  lead_point_id,",
    "  case_id",
    "FROM player_rumor_state",
    `WHERE player_id = '${escapedPlayerId}'`,
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

const parsePlayerRumorStateRow = (row: unknown): PlayerRumorStateRow => {
  if (Array.isArray(row)) {
    if (row.length < 4) {
      throw new Error("Player rumor state SQL row is missing columns");
    }
    return {
      rumorId: coerceString(row[0], "rumor_id"),
      status: coerceString(row[1], "status"),
      leadPointId: coerceNullableString(row[2]),
      caseId: coerceString(row[3], "case_id"),
    };
  }

  if (typeof row === "object" && row !== null) {
    const record = row as Record<string, unknown>;
    return {
      rumorId: coerceString(record.rumor_id ?? record.rumorId, "rumor_id"),
      status: coerceString(record.status, "status"),
      leadPointId: coerceNullableString(
        record.lead_point_id ?? record.leadPointId,
      ),
      caseId: coerceString(record.case_id ?? record.caseId, "case_id"),
    };
  }

  throw new Error("Unsupported player rumor state row shape");
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
    activePoi?: string;
    districtState?: string;
    resourceProfile?: string;
    pendingRumors?: string;
    branchOpportunities?: string;
    proceduralBudget?: string;
    visualStateHints?: string;
  },
): string => {
  const envelope = payload.sceneResultEnvelope;
  const envelopeCheckResult = envelope?.checkResult;
  const effectiveNodeId = envelope?.nodeId ?? payload.nodeId;
  const scenario = snapshot
    ? getScenarioById(snapshot, payload.scenarioId)
    : null;
  const node = snapshot ? getNodeById(snapshot, effectiveNodeId) : null;
  const outcomeGrade =
    envelopeCheckResult?.outcomeGrade ?? payload.outcomeGrade;
  const outcome =
    outcomeGrade === "critical"
      ? "critical success"
      : outcomeGrade === "success_with_cost"
        ? "success with cost"
        : outcomeGrade === "fail"
          ? "failure"
          : payload.passed
            ? "success"
            : "failure";
  const voicePresenceMode =
    envelope?.ensemble?.presenceMode ?? payload.voicePresenceMode;
  const activeSpeakers =
    envelope?.ensemble?.activeSpeakers ?? payload.activeSpeakers;
  const canonicalVoiceId = canonicalSkillVoiceIdFor(payload.voiceId);
  const canonicalActiveSpeakers = activeSpeakers
    ? canonicalizeSpeakerIds(activeSpeakers)
    : [];
  const psyche = envelope?.playerState.psyche ?? payload.psycheProfile;
  const parts = [
    `Scenario: ${scenario?.title ?? payload.scenarioId}`,
    `Node: ${node?.title ?? effectiveNodeId}`,
    `Location: ${envelope?.locationName ?? payload.locationName}`,
    `Speaker: ${payload.characterName?.trim() || "Narrator"}`,
    `Outcome: ${outcome}`,
  ];

  if (envelopeCheckResult) {
    parts.push(`Outcome margin: ${envelopeCheckResult.margin}`);
  }
  if (payload.voiceId !== canonicalVoiceId) {
    parts.push(`Voice bridge: ${payload.voiceId} -> ${canonicalVoiceId}`);
  }
  parts.push(
    `Canonical voice: ${getCanonicalVoiceLabel(canonicalVoiceId)} (${canonicalVoiceId})`,
  );
  const canonicalVoicePromptBrief = buildCanonicalVoicePromptBrief(
    payload.voiceId,
  );
  if (canonicalVoicePromptBrief) {
    parts.push(`Voice style guide: ${canonicalVoicePromptBrief}`);
  }
  if (voicePresenceMode) {
    parts.push(`Voice presence: ${voicePresenceMode}`);
  }
  if (activeSpeakers && activeSpeakers.length > 0) {
    parts.push(`Active speakers: ${activeSpeakers.join(", ")}`);
  }
  if (canonicalActiveSpeakers.length > 0) {
    parts.push(`Canonical speakers: ${canonicalActiveSpeakers.join(", ")}`);
  }
  const parliamentPromptStack = activeSpeakers
    ? buildParliamentPromptStack(activeSpeakers)
    : null;
  if (parliamentPromptStack) {
    parts.push(`Parliament style stack: ${parliamentPromptStack}`);
  }
  if (psyche) {
    parts.push(
      `Psyche: x=${psyche.axisX}, y=${psyche.axisY}, approach=${psyche.approach}`,
    );
    if (psyche.dominantInnerVoiceId) {
      parts.push(`Dominant inner voice: ${psyche.dominantInnerVoiceId}`);
    }
    if (psyche.activeInnerVoiceIds.length > 0) {
      parts.push(
        `Inner voice parliament: ${psyche.activeInnerVoiceIds.join(", ")}`,
      );
    }
  }

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
  if (sceneContext?.activePoi) {
    parts.push(`Active POI: ${sceneContext.activePoi}`);
  }
  if (sceneContext?.districtState) {
    parts.push(`District state: ${sceneContext.districtState}`);
  }
  if (sceneContext?.resourceProfile) {
    parts.push(`Resource profile: ${sceneContext.resourceProfile}`);
  }
  if (sceneContext?.pendingRumors) {
    parts.push(`Pending rumors: ${sceneContext.pendingRumors}`);
  }
  if (sceneContext?.branchOpportunities) {
    parts.push(`Branch opportunities: ${sceneContext.branchOpportunities}`);
  }
  if (sceneContext?.proceduralBudget) {
    parts.push(`Procedural budget: ${sceneContext.proceduralBudget}`);
  }
  if (sceneContext?.visualStateHints) {
    parts.push(`Visual state hints: ${sceneContext.visualStateHints}`);
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

const uniqueSorted = (values: Iterable<string>): string[] =>
  [...new Set(values)].sort((left, right) => left.localeCompare(right));

const resolveScenePoints = (
  snapshot: VnSnapshot | null,
  payload: GenerateDialoguePayload,
): NonNullable<VnSnapshot["map"]>["points"] => {
  if (!snapshot?.map) {
    return [];
  }
  const pointIds = new Set(resolveScenePointIds(snapshot, payload));
  return snapshot.map.points
    .filter((point) => pointIds.has(point.id))
    .sort((left, right) => left.id.localeCompare(right.id));
};

const summarizeActivePoi = (
  points: readonly NonNullable<VnSnapshot["map"]>["points"][number][],
): string | undefined => {
  if (points.length === 0) {
    return undefined;
  }
  return points
    .map((point) => `${point.title} (${point.id}, ${point.locationId})`)
    .join(" | ");
};

const summarizeDistrictState = (
  points: readonly NonNullable<VnSnapshot["map"]>["points"][number][],
): string | undefined => {
  if (points.length === 0) {
    return undefined;
  }
  return points
    .map((point) =>
      [
        `${point.locationId}: region=${point.regionId}`,
        `category=${point.category}`,
        point.unlockGroup ? `unlockGroup=${point.unlockGroup}` : null,
        point.defaultState ? `defaultState=${point.defaultState}` : null,
        point.isHiddenInitially ? "hiddenInitially=true" : null,
      ]
        .filter((entry): entry is string => Boolean(entry))
        .join(", "),
    )
    .join(" | ");
};

const readResourceValue = (
  vars: Readonly<Record<string, number>>,
  key: keyof typeof NARRATIVE_RESOURCE_DEFAULTS,
): number => Math.trunc(vars[key] ?? NARRATIVE_RESOURCE_DEFAULTS[key]);

const summarizeResourceProfile = (
  vars: Readonly<Record<string, number>>,
): string => {
  const providence = readResourceValue(vars, RESOURCE_PROVIDENCE_VAR);
  const fortune = readResourceValue(vars, RESOURCE_FORTUNE_VAR);
  const fortuneMod = readResourceValue(vars, RESOURCE_FORTUNE_MOD_VAR);
  const karma = readResourceValue(vars, RESOURCE_KARMA_VAR);
  return [
    `providence=${providence}`,
    `fortune=${fortune}`,
    `fortuneMod=${fortuneMod}`,
    `effectiveFortune=${resolveEffectiveFortune(fortune, fortuneMod)}`,
    `karma=${karma}`,
    `karmaBand=${resolveKarmaBand(karma)}`,
  ].join(", ");
};

const summarizePendingRumors = (
  snapshot: VnSnapshot | null,
  rows: readonly PlayerRumorStateRow[],
): string | undefined => {
  const pendingStatuses = new Set([
    "registered",
    "heard",
    "logged",
    "pursuing",
  ]);
  const rumorById = new Map(
    (snapshot?.socialCatalog?.rumors ?? []).map((rumor) => [rumor.id, rumor]),
  );
  const summaries = rows
    .filter((row) => pendingStatuses.has(row.status))
    .map((row) => {
      const rumor = rumorById.get(row.rumorId);
      const leadPointId = row.leadPointId ?? rumor?.leadPointId;
      return [
        rumor?.title ?? row.rumorId,
        `status=${row.status}`,
        leadPointId ? `lead=${leadPointId}` : null,
      ]
        .filter((entry): entry is string => Boolean(entry))
        .join(", ");
    });

  return summaries.length > 0 ? summaries.join(" | ") : undefined;
};

const summarizeBranchOpportunities = (
  snapshot: VnSnapshot | null,
  payload: GenerateDialoguePayload,
): string | undefined => {
  const scenario = snapshot
    ? getScenarioById(snapshot, payload.scenarioId)
    : null;
  const caseId = scenario?.packId;
  const activeRules = CASE_CATALOG.triggerRules.filter(
    (rule) =>
      rule.status === "active" &&
      (!caseId || !rule.caseId || rule.caseId === caseId),
  );
  if (activeRules.length === 0) {
    return undefined;
  }

  return activeRules
    .map((rule) =>
      [
        rule.id,
        rule.allowedArchetypeIds && rule.allowedArchetypeIds.length > 0
          ? `archetypes=${rule.allowedArchetypeIds.join(",")}`
          : null,
        rule.generatedNamespace ? `namespace=${rule.generatedNamespace}` : null,
      ]
        .filter((entry): entry is string => Boolean(entry))
        .join(" "),
    )
    .join(" | ");
};

const summarizeProceduralBudget = (
  vars: Readonly<Record<string, number>>,
): string | undefined => {
  const budgetKeys = uniqueSorted(
    CASE_CATALOG.triggerRules.flatMap((rule) =>
      rule.budgetKey ? [rule.budgetKey] : [],
    ),
  );
  if (budgetKeys.length === 0) {
    return undefined;
  }
  return budgetKeys.map((key) => `${key}=${vars[key] ?? 0}`).join(", ");
};

const summarizeVisualStateHints = (
  points: readonly NonNullable<VnSnapshot["map"]>["points"][number][],
): string | undefined => {
  if (points.length === 0) {
    return undefined;
  }
  return points
    .map((point) =>
      [
        `${point.locationId}: visualState=${point.defaultState ?? "default"}`,
        point.image ? `image=${point.image}` : null,
      ]
        .filter((entry): entry is string => Boolean(entry))
        .join(", "),
    )
    .join(" | ");
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
  const sortedRows = [...rows].sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );

  for (const row of sortedRows) {
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
  const rows = await runSpacetimeSql({
    host: options.host,
    database: options.database,
    token: options.token,
    query: buildRecentDialogueQuery(playerId),
    fetchImpl: options.fetchImpl,
  });
  return rows.map(parseRecentDialogueRow);
};

const fetchPlayerQuestRows = async (
  playerId: string,
  options: BuildSceneContextOptions,
): Promise<PlayerQuestRow[]> => {
  const rows = await runSpacetimeSql({
    host: options.host,
    database: options.database,
    token: options.token,
    query: buildPlayerQuestQuery(playerId),
    fetchImpl: options.fetchImpl,
  });
  return rows.map(parsePlayerQuestRow);
};

const fetchPlayerFlagRows = async (
  playerId: string,
  options: BuildSceneContextOptions,
): Promise<PlayerFlagRow[]> => {
  const rows = await runSpacetimeSql({
    host: options.host,
    database: options.database,
    token: options.token,
    query: buildPlayerFlagQuery(playerId),
    fetchImpl: options.fetchImpl,
  });
  return rows.map(parsePlayerFlagRow);
};

const fetchPlayerVarRows = async (
  playerId: string,
  options: BuildSceneContextOptions,
): Promise<PlayerVarRow[]> => {
  const rows = await runSpacetimeSql({
    host: options.host,
    database: options.database,
    token: options.token,
    query: buildPlayerVarQuery(playerId),
    fetchImpl: options.fetchImpl,
  });
  return rows.map(parsePlayerVarRow);
};

const fetchPlayerRumorStateRows = async (
  playerId: string,
  options: BuildSceneContextOptions,
): Promise<PlayerRumorStateRow[]> => {
  const rows = await runSpacetimeSql({
    host: options.host,
    database: options.database,
    token: options.token,
    query: buildPlayerRumorStateQuery(playerId),
    fetchImpl: options.fetchImpl,
  });
  return rows.map(parsePlayerRumorStateRow);
};

const fetchActiveSnapshot = async (
  options: BuildSceneContextOptions,
): Promise<VnSnapshot | null> => {
  const rows = await runSpacetimeSql({
    host: options.host,
    database: options.database,
    token: options.token,
    query: buildActiveSnapshotQuery(),
    fetchImpl: options.fetchImpl,
  });
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
    playerRumorResult,
    snapshotResult,
  ] = await Promise.allSettled([
    fetchRecentDialogueRows(job.playerId, options),
    fetchPlayerQuestRows(job.playerId, options),
    fetchPlayerFlagRows(job.playerId, options),
    fetchPlayerVarRows(job.playerId, options),
    fetchPlayerRumorStateRows(job.playerId, options),
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
  if (playerRumorResult.status === "rejected") {
    logRetrievalFailure("player rumor retrieval", playerRumorResult.reason);
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
  const scenePoints = resolveScenePoints(snapshot, payload);
  const activePoi = summarizeActivePoi(scenePoints);
  const districtState = summarizeDistrictState(scenePoints);
  const resourceProfile = summarizeResourceProfile(vars);
  const pendingRumors =
    playerRumorResult.status === "fulfilled"
      ? summarizePendingRumors(snapshot, playerRumorResult.value)
      : undefined;
  const branchOpportunities = summarizeBranchOpportunities(snapshot, payload);
  const proceduralBudget = summarizeProceduralBudget(vars);
  const visualStateHints = summarizeVisualStateHints(scenePoints);
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
      activePoi,
      districtState,
      resourceProfile,
      pendingRumors,
      branchOpportunities,
      proceduralBudget,
      visualStateHints,
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
    activePoi,
    districtState,
    resourceProfile,
    pendingRumors,
    branchOpportunities,
    proceduralBudget,
    visualStateHints,
  };
};
