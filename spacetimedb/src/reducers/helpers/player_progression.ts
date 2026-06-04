import { Timestamp } from "spacetimedb";
import { SenderError } from "spacetimedb/server";
import {
  LEGACY_REPUTATION_VAR_BY_FACTION_ID,
  isAllowedFactionId,
} from "../../../../data/factionContract";
import {
  isInnerVoiceRankVarKey,
  normalizeInnerVoiceRank,
  PSYCHE_VAR_KEYS,
  type SkillVoiceId,
} from "../../../../data/innerVoiceContract";
import {
  NARRATIVE_RESOURCE_DEFAULTS,
  isNarrativeResourceKey,
  normalizeNarrativeResourceValue,
  resolveKarmaBand as sharedResolveKarmaBand,
  resolveKarmaDifficultyDelta as sharedResolveKarmaDifficultyDelta,
} from "../../../../src/shared/game/narrativeResources";
import {
  SKILL_XP_PER_RANK,
  isSkillXpVarKey,
  normalizeSkillXpValue,
  skillXpVarKeyFor,
} from "../../../../src/shared/game/skillProgression";
import {
  ORIGIN_CORE_PROFILES,
  normalizeCharacterProgressionVarValue,
} from "../../../../src/shared/game/characterProgression";
import type { ReducerContextLike } from "./context";
import { senderOf } from "./context";
import {
  createFactionSignalKey,
  createFavorLedgerKey,
  createNpcFavorKey,
  createRumorStateKey,
  createVarKey,
} from "./entity_keys";
import { getFactionIdValidationError } from "./factionSignalGuard";
import {
  createFlagKey,
  createNpcStateKey,
  createRelationshipKey,
} from "./map_keys";
import { assertNonEmpty } from "./payload_json";
import {
  ensurePlayerProfile,
  ensurePlayerProfileForPlayer,
} from "./player_profile";
import { normalizeRumorStatus, type RumorStateStatus } from "./rumor_status";
import { getActiveSnapshot } from "./snapshot";
import type {
  AgencyServiceCriterionId,
  CareerRankDefinition,
  FactionSignalTrend,
  NpcAvailabilityState,
  RumorTemplate,
  RumorVerificationKind,
  SocialCatalogSnapshot,
} from "../../../../src/shared/vn-contract";

type CatalogRumorTemplate = RumorTemplate & {
  sourceType?: string;
  factionKey?: string;
  subject?: string;
  locationHint?: string;
  credibility?: number;
  heatRisk?: number;
};

export type FavorType =
  | "information"
  | "access"
  | "cover"
  | "introduction"
  | "protection";

export const isFavorType = (value: unknown): value is FavorType =>
  value === "information" ||
  value === "access" ||
  value === "cover" ||
  value === "introduction" ||
  value === "protection";

export type FavorLedgerStatus = "open" | "spent" | "released" | "burned";

export const isFavorLedgerStatus = (
  value: unknown,
): value is FavorLedgerStatus =>
  value === "open" ||
  value === "spent" ||
  value === "released" ||
  value === "burned";

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizePlayerVarValue = (key: string, floatValue: number): number => {
  const characterProgressionValue = normalizeCharacterProgressionVarValue(
    key,
    floatValue,
  );
  if (characterProgressionValue !== null) {
    return characterProgressionValue;
  }
  if (PSYCHE_VAR_KEYS.includes(key as any)) {
    return clampNumber(floatValue, -100, 100);
  }
  if (isInnerVoiceRankVarKey(key)) {
    return normalizeInnerVoiceRank(floatValue);
  }
  if (isSkillXpVarKey(key)) {
    return normalizeSkillXpValue(floatValue);
  }
  if (isNarrativeResourceKey(key)) {
    return normalizeNarrativeResourceValue(key, floatValue);
  }
  return floatValue;
};

export const getVarForPlayer = (
  ctx: any,
  playerId: { toHexString(): string },
  key: string,
): number => {
  const row = ctx.db.playerVar.varId.find(createVarKey(playerId, key));
  return row?.floatValue ?? 0;
};

export const getVarsForPlayer = (
  ctx: any,
  playerId: { toHexString(): string },
): Record<string, number> => {
  const vars: Record<string, number> = {};
  for (const row of rowsByIndex<{ key: string; floatValue: number }>(
    ctx.db.playerVar,
    "player_var_player_id",
    playerId,
  )) {
    vars[row.key] = row.floatValue;
  }
  return vars;
};

export const upsertVarForPlayer = (
  ctx: any,
  playerId: { toHexString(): string },
  key: string,
  floatValue: number,
): void => {
  assertNonEmpty(key, "key");
  if (!Number.isFinite(floatValue)) {
    throw new SenderError("floatValue must be a finite number");
  }

  ensurePlayerProfileForPlayer(ctx, playerId);
  const normalizedFloatValue = normalizePlayerVarValue(key, floatValue);

  const varId = createVarKey(playerId, key);
  const existing = ctx.db.playerVar.varId.find(varId);
  if (existing) {
    ctx.db.playerVar.varId.update({
      ...existing,
      floatValue: normalizedFloatValue,
      updatedAt: ctx.timestamp,
    });
    return;
  }

  ctx.db.playerVar.insert({
    varId,
    playerId,
    key,
    floatValue: normalizedFloatValue,
    updatedAt: ctx.timestamp,
  });
};

export const addToVarForPlayer = (
  ctx: any,
  playerId: { toHexString(): string },
  key: string,
  delta: number,
): void => {
  const current = getVarForPlayer(ctx, playerId, key);
  upsertVarForPlayer(ctx, playerId, key, current + delta);
};

export const getSkillXpForPlayer = (
  ctx: any,
  playerId: { toHexString(): string },
  skillId: SkillVoiceId,
): number => {
  const xpKey = skillXpVarKeyFor(skillId);
  const existing = ctx.db.playerVar.varId.find(createVarKey(playerId, xpKey));
  if (existing) {
    return normalizeSkillXpValue(existing.floatValue);
  }

  return normalizeSkillXpValue(
    getVarForPlayer(ctx, playerId, skillId) * SKILL_XP_PER_RANK,
  );
};

export const addSkillXpForPlayer = (
  ctx: any,
  playerId: { toHexString(): string },
  skillId: SkillVoiceId,
  amount: number,
): number => {
  const current = getSkillXpForPlayer(ctx, playerId, skillId);
  const next = normalizeSkillXpValue(current + amount);
  upsertVarForPlayer(ctx, playerId, skillXpVarKeyFor(skillId), next);
  return next;
};

export const addSkillXp = (
  ctx: any,
  skillId: SkillVoiceId,
  amount: number,
): number => addSkillXpForPlayer(ctx, ctx.sender, skillId, amount);

export const ensureNarrativeResourcesForPlayer = (
  ctx: any,
  playerId: { toHexString(): string },
): void => {
  ensurePlayerProfileForPlayer(ctx, playerId);

  for (const [key, defaultValue] of Object.entries(
    NARRATIVE_RESOURCE_DEFAULTS,
  )) {
    if (!ctx.db.playerVar.varId.find(createVarKey(playerId, key))) {
      upsertVarForPlayer(ctx, playerId, key, defaultValue);
    }
  }
};

export const ensureNarrativeResources = (ctx: any): void => {
  ensureNarrativeResourcesForPlayer(ctx, ctx.sender);
};

export const resolveKarmaBand = (value: number) =>
  sharedResolveKarmaBand(value);

export const resolveKarmaDifficultyDelta = (value: number) =>
  sharedResolveKarmaDifficultyDelta(value);

const rowsByIndex = <TRow>(
  tableView: any,
  indexAccessorName: string,
  value: unknown,
): TRow[] => {
  const index = tableView?.[indexAccessorName] as
    | { filter?: (value: unknown) => Iterable<TRow> }
    | undefined;
  if (!index || typeof index.filter !== "function") {
    throw new Error(`Missing table index ${indexAccessorName}`);
  }
  return Array.from(index.filter(value));
};

const hasRowsByIndex = (
  tableView: any,
  indexAccessorName: string,
  value: unknown,
): boolean => {
  for (const _row of rowsByIndex(tableView, indexAccessorName, value)) {
    return true;
  }
  return false;
};

const PLAYER_SCOPED_PROGRESS_TABLES = [
  ["vnSession", "vn_session_player_id", "sessionKey", "sessionKey"],
  [
    "vnSkillCheckResult",
    "vn_skill_check_result_player_id",
    "resultKey",
    "resultKey",
  ],
  ["playerFlag", "player_flag_player_id", "flagId", "flagId"],
  ["playerVar", "player_var_player_id", "varId", "varId"],
  [
    "playerInventory",
    "player_inventory_player_id",
    "inventoryKey",
    "inventoryKey",
  ],
  ["playerEvidence", "player_evidence_player_id", "evidenceKey", "evidenceKey"],
  ["playerQuest", "player_quest_player_id", "questKey", "questKey"],
  [
    "playerRelationship",
    "player_relationship_player_id",
    "relationshipKey",
    "relationshipKey",
  ],
  [
    "playerNpcState",
    "player_npc_state_player_id",
    "npcStateKey",
    "npcStateKey",
  ],
  ["playerNpcFavor", "player_npc_favor_player_id", "favorKey", "favorKey"],
  [
    "playerFavorLedger",
    "player_favor_ledger_player_id",
    "ledgerEntryKey",
    "ledgerEntryKey",
  ],
  [
    "playerFactionSignal",
    "player_faction_signal_player_id",
    "signalKey",
    "signalKey",
  ],
  [
    "playerRumorState",
    "player_rumor_state_player_id",
    "rumorStateKey",
    "rumorStateKey",
  ],
  [
    "playerUnlockGroup",
    "player_unlock_group_player_id",
    "unlockKey",
    "unlockKey",
  ],
  ["playerMapEvent", "player_map_event_player_id", "eventId", "eventId"],
  [
    "playerMindCase",
    "player_mind_case_player_id",
    "playerCaseKey",
    "playerCaseKey",
  ],
  [
    "playerMindFact",
    "player_mind_fact_player_id",
    "playerFactKey",
    "playerFactKey",
  ],
  [
    "playerMindHypothesis",
    "player_mind_hypothesis_player_id",
    "playerHypothesisKey",
    "playerHypothesisKey",
  ],
  [
    "playerRedeemedCode",
    "player_redeemed_code_player_id",
    "redemptionId",
    "redemptionId",
  ],
  [
    "playerEquipment",
    "player_equipment_player_id",
    "equipmentKey",
    "equipmentKey",
  ],
] as const;

export const hasPlayerGameplayProgress = (ctx: any): boolean => {
  for (const [tableName, indexAccessorName] of PLAYER_SCOPED_PROGRESS_TABLES) {
    if (hasRowsByIndex(ctx.db[tableName], indexAccessorName, ctx.sender)) {
      return true;
    }
  }

  if (ctx.db.playerAgencyCareer.playerId.find(ctx.sender)) {
    return true;
  }

  const location = ctx.db.playerLocation.playerId.find(ctx.sender);
  return Boolean(location && location.locationId !== "loc_intro");
};

export const resetPlayerGameplayState = (ctx: any): void => {
  for (const [
    tableName,
    indexAccessorName,
    primaryKeyAccessorName,
    primaryKeyColumn,
  ] of PLAYER_SCOPED_PROGRESS_TABLES) {
    const tableView = ctx.db[tableName];
    for (const row of rowsByIndex<Record<string, unknown>>(
      tableView,
      indexAccessorName,
      ctx.sender,
    )) {
      tableView[primaryKeyAccessorName].delete(row[primaryKeyColumn]);
    }
  }

  if (ctx.db.playerAgencyCareer.playerId.find(ctx.sender)) {
    ctx.db.playerAgencyCareer.playerId.delete(ctx.sender);
  }

  upsertLocation(ctx, "loc_intro");
};

export const setNickname = (ctx: any, nickname: string): void => {
  const trimmed = nickname.trim();
  const profile = ctx.db.playerProfile.playerId.find(ctx.sender);
  if (!profile) {
    ctx.db.playerProfile.insert({
      playerId: ctx.sender,
      nickname: trimmed.length > 0 ? trimmed : undefined,
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });
    return;
  }

  ctx.db.playerProfile.playerId.update({
    ...profile,
    nickname: trimmed.length > 0 ? trimmed : undefined,
    updatedAt: ctx.timestamp,
  });
};

export const getFlag = (ctx: ReducerContextLike, key: string): boolean => {
  const sender = senderOf(ctx) as { toHexString(): string };
  const row = ctx.db.playerFlag.flagId.find(createFlagKey(sender, key));
  return row?.value ?? false;
};

export const upsertFlag = (
  ctx: ReducerContextLike,
  key: string,
  value: boolean,
): void => {
  assertNonEmpty(key, "key");
  ensurePlayerProfile(ctx);

  const sender = senderOf(ctx) as { toHexString(): string };
  const flagId = createFlagKey(sender, key);
  const existing = ctx.db.playerFlag.flagId.find(flagId);
  if (existing) {
    ctx.db.playerFlag.flagId.update({
      ...existing,
      value,
      updatedAt: ctx.timestamp,
    });
    return;
  }

  ctx.db.playerFlag.insert({
    flagId,
    playerId: sender,
    key,
    value,
    updatedAt: ctx.timestamp,
  });
};

export const getVar = (ctx: ReducerContextLike, key: string): number => {
  return getVarForPlayer(ctx, senderOf(ctx) as { toHexString(): string }, key);
};

export const getVars = (ctx: ReducerContextLike): Record<string, number> =>
  getVarsForPlayer(ctx, senderOf(ctx) as { toHexString(): string });

export const resolveActiveOriginId = (
  ctx: ReducerContextLike,
): string | null => {
  for (const profile of Object.values(ORIGIN_CORE_PROFILES)) {
    if (getFlag(ctx, profile.flagKey)) {
      return profile.id;
    }
  }
  return null;
};

export const upsertVar = (
  ctx: ReducerContextLike,
  key: string,
  floatValue: number,
): void => {
  upsertVarForPlayer(
    ctx,
    senderOf(ctx) as { toHexString(): string },
    key,
    floatValue,
  );
};

export const addToVar = (
  ctx: ReducerContextLike,
  key: string,
  delta: number,
): void => {
  addToVarForPlayer(
    ctx,
    senderOf(ctx) as { toHexString(): string },
    key,
    delta,
  );
};

const DEFAULT_NPC_AVAILABILITY: NpcAvailabilityState = "available";
const DEFAULT_CAREER_RANKS: CareerRankDefinition[] = [
  {
    id: "trainee",
    label: "Стажёр",
    order: 0,
    standingRequired: -100,
    serviceCriteriaNeeded: 0,
    privileges: ["agency_briefing_access"],
  },
  {
    id: "junior_detective",
    label: "Младший детектив",
    order: 1,
    standingRequired: 15,
    qualifyingCaseId: "quest_banker",
    serviceCriteriaNeeded: 2,
    privileges: ["agency_caseboard_access", "field_warrant_support"],
  },
  {
    id: "agency_detective",
    label: "Детектив агентства",
    order: 2,
    standingRequired: 35,
    serviceCriteriaNeeded: 2,
    privileges: ["briefing_priority", "wider_archive_access"],
  },
  {
    id: "senior_detective",
    label: "Старший детектив",
    order: 3,
    standingRequired: 55,
    serviceCriteriaNeeded: 2,
    privileges: ["agency_cover", "contact_network_priority"],
  },
  {
    id: "lead_investigator",
    label: "Ведущий следователь",
    order: 4,
    standingRequired: 75,
    serviceCriteriaNeeded: 2,
    privileges: ["citywide_priority_access", "special_assignment_lead"],
  },
];

const FACTION_SIGNAL_VAR_BY_ID: Record<string, string> =
  LEGACY_REPUTATION_VAR_BY_FACTION_ID;

const resolveTrend = (delta: number): FactionSignalTrend => {
  if (delta > 0) {
    return "rising";
  }
  if (delta < 0) {
    return "falling";
  }
  return "stable";
};

const clampTrustScore = (value: number): number =>
  clampNumber(value, -100, 100);

const clampStandingScore = (value: number): number =>
  clampNumber(value, -100, 100);

const getLegacyRelationshipValue = (ctx: any, characterId: string): number => {
  const row = ctx.db.playerRelationship.relationshipKey.find(
    createRelationshipKey(ctx.sender, characterId),
  );
  return row ? row.value : 0;
};

const upsertLegacyRelationshipProjection = (
  ctx: any,
  characterId: string,
  value: number,
): void => {
  const relationshipKey = createRelationshipKey(ctx.sender, characterId);
  const existing =
    ctx.db.playerRelationship.relationshipKey.find(relationshipKey);
  if (existing) {
    ctx.db.playerRelationship.relationshipKey.update({
      ...existing,
      value,
      updatedAt: ctx.timestamp,
    });
    return;
  }

  ctx.db.playerRelationship.insert({
    relationshipKey,
    playerId: ctx.sender,
    characterId,
    value,
    updatedAt: ctx.timestamp,
  });
};

const tryGetActiveSocialCatalog = (
  ctx: any,
): SocialCatalogSnapshot | undefined => {
  try {
    return getActiveSnapshot(ctx).snapshot.socialCatalog;
  } catch (_error) {
    return undefined;
  }
};

const getCareerRankDefinitions = (ctx: any): CareerRankDefinition[] => {
  const catalogRanks = tryGetActiveSocialCatalog(ctx)?.careerRanks;
  const ranks =
    catalogRanks && catalogRanks.length > 0
      ? catalogRanks
      : DEFAULT_CAREER_RANKS;
  return [...ranks].sort((left, right) => left.order - right.order);
};

const getRumorTemplate = (
  ctx: any,
  rumorId: string,
): CatalogRumorTemplate | undefined =>
  tryGetActiveSocialCatalog(ctx)?.rumors.find(
    (entry) => entry.id === rumorId,
  ) as CatalogRumorTemplate | undefined;

export const getRelationshipValue = (ctx: any, characterId: string): number => {
  const row = ctx.db.playerNpcState.npcStateKey.find(
    createNpcStateKey(ctx.sender, characterId),
  );
  return row ? row.trustScore : getLegacyRelationshipValue(ctx, characterId);
};

export const changeRelationshipTrust = (
  ctx: any,
  characterId: string,
  delta: number,
): number => {
  assertNonEmpty(characterId, "characterId");
  ensurePlayerProfile(ctx);

  const npcStateKey = createNpcStateKey(ctx.sender, characterId);
  const existing = ctx.db.playerNpcState.npcStateKey.find(npcStateKey);
  const currentValue = existing
    ? existing.trustScore
    : getLegacyRelationshipValue(ctx, characterId);
  const nextValue = clampTrustScore(currentValue + delta);

  if (existing) {
    ctx.db.playerNpcState.npcStateKey.update({
      ...existing,
      trustScore: nextValue,
      availabilityState: existing.availabilityState || DEFAULT_NPC_AVAILABILITY,
      lastMeaningfulContactAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });
  } else {
    ctx.db.playerNpcState.insert({
      npcStateKey,
      playerId: ctx.sender,
      npcId: characterId,
      trustScore: nextValue,
      availabilityState: DEFAULT_NPC_AVAILABILITY,
      lastMeaningfulContactAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });
  }

  upsertLegacyRelationshipProjection(ctx, characterId, nextValue);
  return nextValue;
};

export const getFavorBalance = (ctx: any, npcId: string): number => {
  const row = ctx.db.playerNpcFavor.favorKey.find(
    createNpcFavorKey(ctx.sender, npcId),
  );
  return row ? row.balance : 0;
};

export const changeFavorBalanceInternal = (
  ctx: any,
  npcId: string,
  delta: number,
  reason?: string,
): number => {
  assertNonEmpty(npcId, "npcId");
  ensurePlayerProfile(ctx);

  const favorKey = createNpcFavorKey(ctx.sender, npcId);
  const existing = ctx.db.playerNpcFavor.favorKey.find(favorKey);
  const nextValue = (existing ? existing.balance : 0) + Math.trunc(delta);

  if (existing) {
    ctx.db.playerNpcFavor.favorKey.update({
      ...existing,
      balance: nextValue,
      lastReason: reason ?? existing.lastReason,
      updatedAt: ctx.timestamp,
    });
  } else {
    ctx.db.playerNpcFavor.insert({
      favorKey,
      playerId: ctx.sender,
      npcId,
      balance: nextValue,
      lastReason: reason,
      updatedAt: ctx.timestamp,
    });
  }

  return nextValue;
};

export interface RecordFavorArgs {
  favorId: string;
  npcId: string;
  favorType: FavorType;
  // Signed: positive = NPC owes player, negative = player owes NPC.
  weight: number;
  sourceCaseId?: string;
  sourceRumorId?: string;
  note?: string;
  expiresAt?: Timestamp;
}

// Authoritative entry point for creating an obligation. Inserts a ledger row
// and atomically applies the weight to the player_npc_favor summary.
// Idempotent on (playerId, favorId): re-calling with the same favorId is a no-op.
export const recordFavorInternal = (
  ctx: any,
  args: RecordFavorArgs,
): number => {
  assertNonEmpty(args.favorId, "favorId");
  assertNonEmpty(args.npcId, "npcId");
  if (!isFavorType(args.favorType)) {
    throw new SenderError(`Unknown favor type: ${String(args.favorType)}`);
  }
  ensurePlayerProfile(ctx);

  const weight = Math.trunc(args.weight);
  if (weight === 0) {
    throw new SenderError("favor weight must be non-zero");
  }

  const ledgerEntryKey = createFavorLedgerKey(ctx.sender, args.favorId);
  const existing = ctx.db.playerFavorLedger.ledgerEntryKey.find(ledgerEntryKey);
  if (existing) {
    return getFavorBalance(ctx, args.npcId);
  }

  ctx.db.playerFavorLedger.insert({
    ledgerEntryKey,
    playerId: ctx.sender,
    favorId: args.favorId,
    npcId: args.npcId,
    favorType: args.favorType,
    weight,
    sourceCaseId: args.sourceCaseId,
    sourceRumorId: args.sourceRumorId,
    note: args.note,
    status: "open",
    createdAt: ctx.timestamp,
    expiresAt: args.expiresAt,
    resolvedAt: undefined,
    updatedAt: ctx.timestamp,
  });

  return changeFavorBalanceInternal(ctx, args.npcId, weight, args.note);
};

// Closes an obligation. Reverses the original weight on player_npc_favor.balance
// so the summary stays consistent with the ledger. Idempotent on already-resolved entries.
export const resolveFavorInternal = (
  ctx: any,
  favorId: string,
  resolution: FavorLedgerStatus,
): void => {
  assertNonEmpty(favorId, "favorId");
  if (!isFavorLedgerStatus(resolution) || resolution === "open") {
    throw new SenderError(`Invalid favor resolution: ${String(resolution)}`);
  }
  ensurePlayerProfile(ctx);

  const ledgerEntryKey = createFavorLedgerKey(ctx.sender, favorId);
  const existing = ctx.db.playerFavorLedger.ledgerEntryKey.find(ledgerEntryKey);
  if (!existing) {
    throw new SenderError(`Favor ${favorId} not found`);
  }
  if (existing.status !== "open") {
    return;
  }

  ctx.db.playerFavorLedger.ledgerEntryKey.update({
    ...existing,
    status: resolution,
    resolvedAt: ctx.timestamp,
    updatedAt: ctx.timestamp,
  });

  changeFavorBalanceInternal(
    ctx,
    existing.npcId,
    -existing.weight,
    `${resolution}:${favorId}`,
  );
};

export const getFactionSignalValue = (ctx: any, factionId: string): number => {
  if (!isAllowedFactionId(factionId)) {
    return 0;
  }

  const row = ctx.db.playerFactionSignal.signalKey.find(
    createFactionSignalKey(ctx.sender, factionId),
  );
  if (row) {
    return row.value;
  }

  const mirrorVarKey = FACTION_SIGNAL_VAR_BY_ID[factionId];
  return mirrorVarKey ? getVar(ctx, mirrorVarKey) : 0;
};

export const changeFactionSignalInternal = (
  ctx: any,
  factionId: string,
  delta: number,
  reason?: string,
): number => {
  assertNonEmpty(factionId, "factionId");
  const factionIdError = getFactionIdValidationError(factionId);
  if (factionIdError) {
    throw new SenderError(factionIdError);
  }
  ensurePlayerProfile(ctx);

  const signalKey = createFactionSignalKey(ctx.sender, factionId);
  const existing = ctx.db.playerFactionSignal.signalKey.find(signalKey);
  const nextValue = clampNumber(
    getFactionSignalValue(ctx, factionId) + delta,
    -100,
    100,
  );
  const trend = resolveTrend(delta);

  if (existing) {
    ctx.db.playerFactionSignal.signalKey.update({
      ...existing,
      value: nextValue,
      trend,
      updatedAt: ctx.timestamp,
    });
  } else {
    ctx.db.playerFactionSignal.insert({
      signalKey,
      playerId: ctx.sender,
      factionId,
      value: nextValue,
      trend,
      updatedAt: ctx.timestamp,
    });
  }

  const mirrorVarKey = FACTION_SIGNAL_VAR_BY_ID[factionId];
  if (mirrorVarKey) {
    upsertVar(ctx, mirrorVarKey, nextValue);
  }

  return nextValue;
};

const countCompletedServiceCriteria = (row: {
  rumorCriterionComplete: boolean;
  sourceCriterionComplete: boolean;
  cleanClosureCriterionComplete: boolean;
}): number =>
  Number(row.rumorCriterionComplete) +
  Number(row.sourceCriterionComplete) +
  Number(row.cleanClosureCriterionComplete);

export const ensureAgencyCareerRow = (ctx: any) => {
  ensurePlayerProfile(ctx);

  const existing = ctx.db.playerAgencyCareer.playerId.find(ctx.sender);
  if (existing) {
    return existing;
  }

  const initialRank = getCareerRankDefinitions(ctx)[0]?.id ?? "trainee";
  const row = {
    playerId: ctx.sender,
    standingScore: 0,
    standingTrend: "stable",
    rankId: initialRank,
    qualifyingCaseId: undefined,
    rumorCriterionComplete: false,
    sourceCriterionComplete: false,
    cleanClosureCriterionComplete: false,
    updatedAt: ctx.timestamp,
    promotedAt: undefined,
  };
  ctx.db.playerAgencyCareer.insert(row);
  return row;
};

export const getAgencyStandingScore = (ctx: any): number =>
  ensureAgencyCareerRow(ctx).standingScore;

export const getCareerRankOrder = (ctx: any, rankId: string): number => {
  const definition = getCareerRankDefinitions(ctx).find(
    (entry) => entry.id === rankId,
  );
  return definition?.order ?? -1;
};

const promoteAgencyCareerIfEligible = (ctx: any): void => {
  let current = ensureAgencyCareerRow(ctx);
  const ranks = getCareerRankDefinitions(ctx);

  while (true) {
    const currentRank = ranks.find((entry) => entry.id === current.rankId);
    const nextRank = ranks.find(
      (entry) => entry.order === (currentRank?.order ?? -1) + 1,
    );
    if (!nextRank) {
      return;
    }

    const hasStanding = current.standingScore >= nextRank.standingRequired;
    const hasQualifyingCase =
      !nextRank.qualifyingCaseId ||
      current.qualifyingCaseId === nextRank.qualifyingCaseId;
    const hasCriteria =
      countCompletedServiceCriteria(current) >= nextRank.serviceCriteriaNeeded;

    if (!hasStanding || !hasQualifyingCase || !hasCriteria) {
      return;
    }

    current = {
      ...current,
      rankId: nextRank.id,
      promotedAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    };
    ctx.db.playerAgencyCareer.playerId.update(current);
  }
};

export const syncAgencyCareerQualifyingCase = (
  ctx: any,
  questId: string,
  stage: number,
): void => {
  if (questId !== "quest_banker" || stage < 3) {
    return;
  }

  const current = ensureAgencyCareerRow(ctx);
  ctx.db.playerAgencyCareer.playerId.update({
    ...current,
    qualifyingCaseId: questId,
    updatedAt: ctx.timestamp,
  });
  promoteAgencyCareerIfEligible(ctx);
};

export const changeAgencyStandingInternal = (
  ctx: any,
  delta: number,
  reason?: string,
): number => {
  const current = ensureAgencyCareerRow(ctx);
  const nextValue = clampStandingScore(current.standingScore + delta);
  const nextRow = {
    ...current,
    standingScore: nextValue,
    standingTrend: resolveTrend(delta),
    updatedAt: ctx.timestamp,
  };
  ctx.db.playerAgencyCareer.playerId.update(nextRow);
  promoteAgencyCareerIfEligible(ctx);
  return nextValue;
};

export const recordServiceCriterionInternal = (
  ctx: any,
  criterionId: AgencyServiceCriterionId,
): void => {
  const current = ensureAgencyCareerRow(ctx);
  const nextRow = {
    ...current,
    rumorCriterionComplete:
      criterionId === "verified_rumor_chain"
        ? true
        : current.rumorCriterionComplete,
    sourceCriterionComplete:
      criterionId === "preserved_source_network"
        ? true
        : current.sourceCriterionComplete,
    cleanClosureCriterionComplete:
      criterionId === "clean_closure"
        ? true
        : current.cleanClosureCriterionComplete,
    updatedAt: ctx.timestamp,
  };
  ctx.db.playerAgencyCareer.playerId.update(nextRow);
  promoteAgencyCareerIfEligible(ctx);
};

export const getRumorStatus = (
  ctx: any,
  rumorId: string,
): RumorStateStatus | null => {
  const row = ctx.db.playerRumorState.rumorStateKey.find(
    createRumorStateKey(ctx.sender, rumorId),
  );
  return row ? normalizeRumorStatus(row.status) : null;
};

export const registerRumorInternal = (ctx: any, rumorId: string): void => {
  assertNonEmpty(rumorId, "rumorId");
  ensurePlayerProfile(ctx);

  const rumorKey = createRumorStateKey(ctx.sender, rumorId);
  const existing = ctx.db.playerRumorState.rumorStateKey.find(rumorKey);
  const template = getRumorTemplate(ctx, rumorId);
  const nextRow = {
    rumorStateKey: rumorKey,
    playerId: ctx.sender,
    rumorId,
    status: existing?.status ?? "logged",
    leadPointId: existing?.leadPointId ?? template?.leadPointId,
    sourceNpcId: existing?.sourceNpcId ?? template?.sourceNpcId,
    sourceType: existing?.sourceType ?? template?.sourceType,
    factionKey: existing?.factionKey ?? template?.factionKey,
    subject: existing?.subject ?? template?.subject,
    locationHint: existing?.locationHint ?? template?.locationHint,
    credibility: existing?.credibility ?? template?.credibility,
    heatRisk: existing?.heatRisk ?? template?.heatRisk,
    caseId: existing?.caseId ?? template?.caseId ?? "case_banker_theft",
    resolvedCaseId: existing?.resolvedCaseId,
    verificationKind: existing?.verificationKind,
    discoveredAt: existing?.discoveredAt ?? ctx.timestamp,
    expiresAt: existing?.expiresAt,
    verifiedAt: existing?.verifiedAt,
    updatedAt: ctx.timestamp,
  };

  if (existing) {
    ctx.db.playerRumorState.rumorStateKey.update({
      ...existing,
      ...nextRow,
    });
  } else {
    ctx.db.playerRumorState.insert(nextRow);
  }
};

export const verifyRumorInternal = (
  ctx: any,
  rumorId: string,
  verificationKind: RumorVerificationKind,
): void => {
  assertNonEmpty(rumorId, "rumorId");
  ensurePlayerProfile(ctx);

  const template = getRumorTemplate(ctx, rumorId);
  if (template && !template.verifiesOn.includes(verificationKind)) {
    throw new SenderError(
      `Rumor ${rumorId} cannot be verified via ${verificationKind}`,
    );
  }

  registerRumorInternal(ctx, rumorId);
  const rumorKey = createRumorStateKey(ctx.sender, rumorId);
  const existing = ctx.db.playerRumorState.rumorStateKey.find(rumorKey);
  if (!existing) {
    throw new SenderError(`Rumor ${rumorId} could not be registered`);
  }

  ctx.db.playerRumorState.rumorStateKey.update({
    ...existing,
    status: "verified",
    verificationKind,
    verifiedAt: ctx.timestamp,
    updatedAt: ctx.timestamp,
  });

  if (template?.careerCriterionOnVerify) {
    recordServiceCriterionInternal(ctx, template.careerCriterionOnVerify);
  }
};

export const upsertLocation = (ctx: any, locationId: string): void => {
  assertNonEmpty(locationId, "locationId");
  ensurePlayerProfile(ctx);

  const existing = ctx.db.playerLocation.playerId.find(ctx.sender);
  if (existing) {
    ctx.db.playerLocation.playerId.update({
      ...existing,
      locationId,
      updatedAt: ctx.timestamp,
    });
    return;
  }

  ctx.db.playerLocation.insert({
    playerId: ctx.sender,
    locationId,
    updatedAt: ctx.timestamp,
  });
};
