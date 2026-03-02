import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  createEvidenceKey,
  createInventoryKey,
  createQuestKey,
  createRelationshipKey,
  createUnlockGroupKey,
  emitTelemetry,
  ensureIdempotent,
  ensurePlayerProfile,
  setNickname,
  upsertFlag,
  upsertLocation,
  upsertVar,
} from "./helpers";

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

    const relKey = createRelationshipKey(ctx.sender, characterId);
    const existing = ctx.db.playerRelationship.relationshipKey.find(relKey);

    const newValue = existing ? existing.value + delta : delta;

    if (existing) {
      ctx.db.playerRelationship.relationshipKey.update({
        ...existing,
        value: newValue,
        updatedAt: ctx.timestamp,
      });
    } else {
      ctx.db.playerRelationship.insert({
        relationshipKey: relKey,
        playerId: ctx.sender,
        characterId,
        value: newValue,
        updatedAt: ctx.timestamp,
      });
    }

    emitTelemetry(ctx, "relationship_changed", { characterId }, newValue);
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
