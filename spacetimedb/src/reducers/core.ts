import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  applyEffects,
  cleanupExpiredMapEvents,
  changeAgencyStandingInternal,
  changeFactionSignalInternal,
  changeFavorBalanceInternal,
  changeRelationshipTrust,
  createEvidenceKey,
  createInventoryKey,
  createQuestKey,
  createUnlockGroupKey,
  emitTelemetry,
  ensureIdempotent,
  ensurePlayerProfile,
  getActiveSnapshot,
  getScenario,
  hasPlayerGameplayProgress,
  recordServiceCriterionInternal,
  registerRumorInternal,
  resetPlayerGameplayState,
  setNickname,
  syncAgencyCareerQualifyingCase,
  type VnEffect,
  upsertFlag,
  upsertLocation,
  upsertVar,
  verifyRumorInternal,
} from "./helpers";
import { getFactionIdValidationError } from "./helpers/factionSignalGuard";
import { startScenarioInternal } from "./vn";

const FREIBURG_ORIGIN_ALLOWLIST = {
  journalist: {
    choiceId: "BACKSTORY_JOURNALIST",
    scenarioId: "journalist_agency_wakeup",
  },
  aristocrat: {
    choiceId: "BACKSTORY_ARISTOCRAT",
    scenarioId: "intro_aristocrat",
  },
  veteran: {
    choiceId: "BACKSTORY_VETERAN",
    scenarioId: "intro_veteran",
  },
  archivist: {
    choiceId: "BACKSTORY_ARCHIVIST",
    scenarioId: "intro_archivist",
  },
} as const;

type FreiburgOriginProfileId = keyof typeof FREIBURG_ORIGIN_ALLOWLIST;

const isFreiburgOriginProfileId = (
  value: string,
): value is FreiburgOriginProfileId =>
  Object.prototype.hasOwnProperty.call(FREIBURG_ORIGIN_ALLOWLIST, value);

const resolveOriginChoiceEffects = (
  snapshot: {
    nodes: Array<{ choices: Array<{ id: string; effects?: VnEffect[] }> }>;
  },
  choiceId: string,
): VnEffect[] => {
  for (const node of snapshot.nodes) {
    const choice = node.choices.find((entry) => entry.id === choiceId);
    if (!choice) {
      continue;
    }
    if (!choice.effects || choice.effects.length === 0) {
      throw new SenderError(`Origin choice ${choiceId} has no effects`);
    }
    return choice.effects;
  }

  throw new SenderError(`Origin choice ${choiceId} is missing from snapshot`);
};

export const set_nickname = spacetimedb.reducer(
  { nickname: t.string() },
  (ctx, { nickname }) => {
    ensurePlayerProfile(ctx);
    setNickname(ctx, nickname);
  },
);

export const set_flag = spacetimedb.reducer(
  { key: t.string(), value: t.bool() },
  (ctx, { key, value }) => {
    upsertFlag(ctx, key, value);
    emitTelemetry(ctx, "flag_set", { key, value });
  },
);

export const set_var = spacetimedb.reducer(
  { key: t.string(), floatValue: t.f64() },
  (ctx, { key, floatValue }) => {
    upsertVar(ctx, key, floatValue);
    emitTelemetry(ctx, "var_set", { key, floatValue }, floatValue);
  },
);

export const travel_to = spacetimedb.reducer(
  { locationId: t.string() },
  (ctx, { locationId }) => {
    ensurePlayerProfile(ctx);
    cleanupExpiredMapEvents(ctx);
    upsertLocation(ctx, locationId);
    emitTelemetry(ctx, "travel_to", { locationId });
  },
);

export const track_event = spacetimedb.reducer(
  {
    eventName: t.string(),
    tagsJson: t.string(),
    value: t.f64().optional(),
  },
  (ctx, { eventName, tagsJson, value }) => {
    if (!eventName || eventName.trim().length === 0) {
      throw new SenderError("eventName must not be empty");
    }

    let parsedTags: Record<string, unknown>;
    try {
      parsedTags = JSON.parse(tagsJson) as Record<string, unknown>;
    } catch (_error) {
      throw new SenderError("tagsJson must be valid JSON");
    }

    emitTelemetry(ctx, eventName, parsedTags, value);
  },
);

export const begin_freiburg_origin = spacetimedb.reducer(
  {
    requestId: t.string(),
    profileId: t.string(),
    resetProgress: t.bool(),
  },
  (ctx, { requestId, profileId, resetProgress }) => {
    if (!profileId || profileId.trim().length === 0) {
      throw new SenderError("profileId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "begin_freiburg_origin");
    ensurePlayerProfile(ctx);

    if (!isFreiburgOriginProfileId(profileId)) {
      throw new SenderError(
        "profileId must reference a supported Freiburg origin",
      );
    }

    if (!resetProgress && hasPlayerGameplayProgress(ctx)) {
      throw new SenderError(
        "Existing Freiburg progress requires resetProgress=true",
      );
    }

    if (resetProgress) {
      resetPlayerGameplayState(ctx);
    }

    const { snapshot } = getActiveSnapshot(ctx);
    const profile = FREIBURG_ORIGIN_ALLOWLIST[profileId];
    getScenario(snapshot, profile.scenarioId);

    applyEffects(ctx, resolveOriginChoiceEffects(snapshot, profile.choiceId), {
      sourceType: "home_begin_freiburg_origin",
      sourceId: `home::${profileId}`,
    });

    startScenarioInternal(ctx, profile.scenarioId, {
      skipInboundRouteValidation: true,
    });
  },
);

export const buy_item = spacetimedb.reducer(
  {
    requestId: t.string(),
    itemId: t.string(),
    quantity: t.u32(),
  },
  (ctx, { requestId, itemId, quantity }) => {
    if (!itemId || itemId.trim().length === 0) {
      throw new SenderError("itemId must not be empty");
    }
    if (quantity < 1) {
      throw new SenderError("quantity must be at least 1");
    }

    ensureIdempotent(ctx, requestId, "buy_item");
    ensurePlayerProfile(ctx);

    const inventoryKey = createInventoryKey(ctx.sender, itemId);
    const existing = ctx.db.playerInventory.inventoryKey.find(inventoryKey);

    if (existing) {
      ctx.db.playerInventory.inventoryKey.update({
        ...existing,
        quantity: existing.quantity + quantity,
        updatedAt: ctx.timestamp,
      });
    } else {
      ctx.db.playerInventory.insert({
        inventoryKey,
        playerId: ctx.sender,
        itemId,
        quantity,
        updatedAt: ctx.timestamp,
      });
    }

    emitTelemetry(ctx, "item_purchased", { itemId, quantity }, quantity);
  },
);

export const set_quest_stage = spacetimedb.reducer(
  {
    requestId: t.string(),
    questId: t.string(),
    stage: t.u32(),
  },
  (ctx, { requestId, questId, stage }) => {
    if (!questId || questId.trim().length === 0) {
      throw new SenderError("questId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "set_quest_stage");
    ensurePlayerProfile(ctx);

    const questKey = createQuestKey(ctx.sender, questId);
    const existing = ctx.db.playerQuest.questKey.find(questKey);

    if (existing) {
      if (stage > existing.stage) {
        ctx.db.playerQuest.questKey.update({
          ...existing,
          stage,
          updatedAt: ctx.timestamp,
        });
        syncAgencyCareerQualifyingCase(ctx, questId, stage);
        emitTelemetry(ctx, "quest_stage_set", { questId }, stage);
      }
    } else {
      ctx.db.playerQuest.insert({
        questKey,
        playerId: ctx.sender,
        questId,
        stage,
        updatedAt: ctx.timestamp,
      });
      syncAgencyCareerQualifyingCase(ctx, questId, stage);
      emitTelemetry(ctx, "quest_stage_set", { questId }, stage);
    }
  },
);

export const advance_quest = spacetimedb.reducer(
  {
    requestId: t.string(),
    questId: t.string(),
    delta: t.u32(),
  },
  (ctx, { requestId, questId, delta }) => {
    if (!questId || questId.trim().length === 0) {
      throw new SenderError("questId must not be empty");
    }
    if (delta < 1) {
      throw new SenderError("delta must be at least 1");
    }

    ensureIdempotent(ctx, requestId, "advance_quest");
    ensurePlayerProfile(ctx);

    const questKey = createQuestKey(ctx.sender, questId);
    const existing = ctx.db.playerQuest.questKey.find(questKey);

    const newStage = existing ? existing.stage + delta : delta;

    if (existing) {
      ctx.db.playerQuest.questKey.update({
        ...existing,
        stage: newStage,
        updatedAt: ctx.timestamp,
      });
    } else {
      ctx.db.playerQuest.insert({
        questKey,
        playerId: ctx.sender,
        questId,
        stage: newStage,
        updatedAt: ctx.timestamp,
      });
    }

    emitTelemetry(ctx, "quest_advanced", { questId }, newStage);
  },
);

export const grant_evidence = spacetimedb.reducer(
  {
    requestId: t.string(),
    evidenceId: t.string(),
  },
  (ctx, { requestId, evidenceId }) => {
    if (!evidenceId || evidenceId.trim().length === 0) {
      throw new SenderError("evidenceId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "grant_evidence");
    ensurePlayerProfile(ctx);

    const evidenceKey = createEvidenceKey(ctx.sender, evidenceId);
    if (!ctx.db.playerEvidence.evidenceKey.find(evidenceKey)) {
      ctx.db.playerEvidence.insert({
        evidenceKey,
        playerId: ctx.sender,
        evidenceId,
        discoveredAt: ctx.timestamp,
      });
      emitTelemetry(ctx, "evidence_granted", { evidenceId });
    }
  },
);

export const change_relationship = spacetimedb.reducer(
  {
    requestId: t.string(),
    characterId: t.string(),
    delta: t.f64(),
  },
  (ctx, { requestId, characterId, delta }) => {
    if (!characterId || characterId.trim().length === 0) {
      throw new SenderError("characterId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "change_relationship");
    ensurePlayerProfile(ctx);

    const newValue = changeRelationshipTrust(ctx, characterId, delta);

    emitTelemetry(ctx, "relationship_changed", { characterId }, newValue);
  },
);

export const change_favor_balance = spacetimedb.reducer(
  {
    requestId: t.string(),
    npcId: t.string(),
    delta: t.i32(),
    reason: t.string().optional(),
  },
  (ctx, { requestId, npcId, delta, reason }) => {
    if (!npcId || npcId.trim().length === 0) {
      throw new SenderError("npcId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "change_favor_balance");
    ensurePlayerProfile(ctx);

    const nextValue = changeFavorBalanceInternal(ctx, npcId, delta, reason);
    emitTelemetry(ctx, "favor_balance_changed", { npcId, reason }, nextValue);
  },
);

export const change_agency_standing = spacetimedb.reducer(
  {
    requestId: t.string(),
    delta: t.f64(),
    reason: t.string().optional(),
  },
  (ctx, { requestId, delta, reason }) => {
    ensureIdempotent(ctx, requestId, "change_agency_standing");
    ensurePlayerProfile(ctx);

    const nextValue = changeAgencyStandingInternal(ctx, delta, reason);
    emitTelemetry(ctx, "agency_standing_changed", { reason }, nextValue);
  },
);

export const change_faction_signal = spacetimedb.reducer(
  {
    requestId: t.string(),
    factionId: t.string(),
    delta: t.f64(),
    reason: t.string().optional(),
  },
  (ctx, { requestId, factionId, delta, reason }) => {
    if (!factionId || factionId.trim().length === 0) {
      throw new SenderError("factionId must not be empty");
    }
    const factionIdError = getFactionIdValidationError(factionId);
    if (factionIdError) {
      throw new SenderError(factionIdError);
    }

    ensureIdempotent(ctx, requestId, "change_faction_signal");
    ensurePlayerProfile(ctx);

    const nextValue = changeFactionSignalInternal(
      ctx,
      factionId,
      delta,
      reason,
    );
    emitTelemetry(
      ctx,
      "faction_signal_changed",
      { factionId, reason },
      nextValue,
    );
  },
);

export const register_rumor = spacetimedb.reducer(
  {
    requestId: t.string(),
    rumorId: t.string(),
  },
  (ctx, { requestId, rumorId }) => {
    if (!rumorId || rumorId.trim().length === 0) {
      throw new SenderError("rumorId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "register_rumor");
    ensurePlayerProfile(ctx);

    registerRumorInternal(ctx, rumorId);
    emitTelemetry(ctx, "rumor_registered", { rumorId });
  },
);

export const verify_rumor = spacetimedb.reducer(
  {
    requestId: t.string(),
    rumorId: t.string(),
    verificationKind: t.string(),
  },
  (ctx, { requestId, rumorId, verificationKind }) => {
    if (!rumorId || rumorId.trim().length === 0) {
      throw new SenderError("rumorId must not be empty");
    }
    if (
      verificationKind !== "evidence" &&
      verificationKind !== "fact" &&
      verificationKind !== "service_unlock" &&
      verificationKind !== "map_unlock"
    ) {
      throw new SenderError("verificationKind is invalid");
    }

    ensureIdempotent(ctx, requestId, "verify_rumor");
    ensurePlayerProfile(ctx);

    verifyRumorInternal(
      ctx,
      rumorId,
      verificationKind as "evidence" | "fact" | "service_unlock" | "map_unlock",
    );
    emitTelemetry(ctx, "rumor_verified", { rumorId, verificationKind });
  },
);

export const record_service_criterion = spacetimedb.reducer(
  {
    requestId: t.string(),
    criterionId: t.string(),
  },
  (ctx, { requestId, criterionId }) => {
    if (
      criterionId !== "verified_rumor_chain" &&
      criterionId !== "preserved_source_network" &&
      criterionId !== "clean_closure"
    ) {
      throw new SenderError("criterionId is invalid");
    }

    ensureIdempotent(ctx, requestId, "record_service_criterion");
    ensurePlayerProfile(ctx);

    recordServiceCriterionInternal(
      ctx,
      criterionId as
        | "verified_rumor_chain"
        | "preserved_source_network"
        | "clean_closure",
    );
    emitTelemetry(ctx, "career_criterion_recorded", { criterionId });
  },
);

export const unlock_group = spacetimedb.reducer(
  {
    requestId: t.string(),
    groupId: t.string(),
  },
  (ctx, { requestId, groupId }) => {
    if (!groupId || groupId.trim().length === 0) {
      throw new SenderError("groupId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "unlock_group");
    ensurePlayerProfile(ctx);

    const unlockKey = createUnlockGroupKey(ctx.sender, groupId);
    if (!ctx.db.playerUnlockGroup.unlockKey.find(unlockKey)) {
      ctx.db.playerUnlockGroup.insert({
        unlockKey,
        playerId: ctx.sender,
        groupId,
        unlockedAt: ctx.timestamp,
      });
      emitTelemetry(ctx, "group_unlocked", { groupId });
    }
  },
);

export const grant_xp = spacetimedb.reducer(
  {
    requestId: t.string(),
    amount: t.f64(),
  },
  (ctx, { requestId, amount }) => {
    if (amount <= 0) {
      throw new SenderError("amount must be > 0");
    }

    ensureIdempotent(ctx, requestId, "grant_xp");
    ensurePlayerProfile(ctx);

    const xpKey = "xp_total";
    const varId = `${ctx.sender.toHexString()}::${xpKey}`;
    const existing = ctx.db.playerVar.varId.find(varId);

    const newXp = existing ? existing.floatValue + amount : amount;

    if (existing) {
      ctx.db.playerVar.varId.update({
        ...existing,
        floatValue: newXp,
        updatedAt: ctx.timestamp,
      });
    } else {
      ctx.db.playerVar.insert({
        varId,
        playerId: ctx.sender,
        key: xpKey,
        floatValue: newXp,
        updatedAt: ctx.timestamp,
      });
    }

    emitTelemetry(ctx, "xp_granted", {}, amount);
  },
);

export const grant_item = spacetimedb.reducer(
  {
    requestId: t.string(),
    itemId: t.string(),
    quantity: t.u32(),
  },
  (ctx, { requestId, itemId, quantity }) => {
    if (!itemId || itemId.trim().length === 0) {
      throw new SenderError("itemId must not be empty");
    }
    if (quantity < 1) {
      throw new SenderError("quantity must be at least 1");
    }

    ensureIdempotent(ctx, requestId, "grant_item");
    ensurePlayerProfile(ctx);

    const inventoryKey = createInventoryKey(ctx.sender, itemId);
    const existing = ctx.db.playerInventory.inventoryKey.find(inventoryKey);

    if (existing) {
      ctx.db.playerInventory.inventoryKey.update({
        ...existing,
        quantity: existing.quantity + quantity,
        updatedAt: ctx.timestamp,
      });
    } else {
      ctx.db.playerInventory.insert({
        inventoryKey,
        playerId: ctx.sender,
        itemId,
        quantity,
        updatedAt: ctx.timestamp,
      });
    }

    emitTelemetry(ctx, "item_granted", { itemId, quantity }, quantity);
  },
);
