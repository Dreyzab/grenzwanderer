import { resolvePsycheVarKey } from "../../../../data/innerVoiceContract";
import { openBattleModeInternal } from "./battle_runtime";
import { openCommandModeInternal } from "./command_runtime";
import {
  createEvidenceKey,
  createInventoryKey,
  createQuestKey,
  createUnlockGroupKey,
} from "./keys";
import { identityKey } from "./map_keys";
import { spawnMapEventInternal } from "./map_runtime";
import { emitTelemetry } from "./telemetry";
import type { VnEffect } from "./types";
import { discoverFactInternal } from "./mind_discover";
import {
  addToVar,
  changeAgencyStandingInternal,
  changeFactionSignalInternal,
  changeFavorBalanceInternal,
  changeRelationshipTrust,
  getVar,
  recordServiceCriterionInternal,
  registerRumorInternal,
  syncAgencyCareerQualifyingCase,
  upsertFlag,
  upsertLocation,
  upsertVar,
  verifyRumorInternal,
} from "./player_progression";

const MYSTIC_AWAKENING_VAR = "mystic_awakening";
const MYSTIC_EXPOSURE_VAR = "mystic_exposure";
const MYSTIC_RATIONALIST_BUFFER_VAR = "mystic_rationalist_buffer";
const MYSTIC_SIGHT_MODE_VAR = "mystic_sight_mode_tier";

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const sightModeTier = (mode: "rational" | "sensitive" | "ether"): number => {
  if (mode === "ether") {
    return 2;
  }
  if (mode === "sensitive") {
    return 1;
  }
  return 0;
};

const extractSourceScenarioId = (source?: {
  sourceType: string;
  sourceId: string;
}): string | undefined => {
  if (!source || !source.sourceType.startsWith("vn_")) {
    return undefined;
  }

  const [scenarioId] = source.sourceId.split("::");
  return scenarioId && scenarioId.trim().length > 0 ? scenarioId : undefined;
};

const SPIRIT_VALID_STATES = [
  "hostile",
  "imprisoned",
  "controlled",
  "destroyed",
] as const;

const upsertSpiritStateInternal = (
  ctx: any,
  spiritId: string,
  state: string,
  method?: string,
  imprisonmentItemId?: string,
): void => {
  const key = `${identityKey(ctx.sender)}::spirit::${spiritId}`;
  const existing = ctx.db.playerSpiritState.spiritStateKey.find(key);

  if (existing) {
    ctx.db.playerSpiritState.spiritStateKey.update({
      ...existing,
      state,
      method: method ?? existing.method,
      imprisonmentItemId: imprisonmentItemId ?? existing.imprisonmentItemId,
      capturedAt: state !== "hostile" ? ctx.timestamp : existing.capturedAt,
      updatedAt: ctx.timestamp,
    });
  } else {
    ctx.db.playerSpiritState.insert({
      spiritStateKey: key,
      playerId: ctx.sender,
      spiritId,
      state,
      method,
      imprisonmentItemId,
      capturedAt: state !== "hostile" ? ctx.timestamp : undefined,
      updatedAt: ctx.timestamp,
    });
  }

  const statePrefix = `spirit_state_${spiritId}`;
  for (const s of SPIRIT_VALID_STATES) {
    upsertFlag(ctx, `${statePrefix}::${s}`, s === state);
  }
  if (method) {
    const methodPrefix = `spirit_method_${spiritId}`;
    const validMethods = ["dialogue", "battle", "ritual"];
    for (const m of validMethods) {
      upsertFlag(ctx, `${methodPrefix}::${m}`, m === method);
    }
  }

  emitTelemetry(ctx, `spirit_state_changed`, { spiritId, state, method });
};

export const applyEffects = (
  ctx: any,
  effects: VnEffect[] | undefined,
  source?: { sourceType: string; sourceId: string },
): void => {
  if (!effects || effects.length === 0) {
    return;
  }

  for (const effect of effects) {
    const sourceTab =
      source?.sourceType && source.sourceType.startsWith("vn_") ? "vn" : "map";

    if (effect.type === "set_flag") {
      upsertFlag(ctx, effect.key, effect.value);
      continue;
    }
    if (effect.type === "set_var") {
      upsertVar(ctx, effect.key, effect.value);
      continue;
    }
    if (effect.type === "add_var") {
      addToVar(ctx, effect.key, effect.value);
      continue;
    }
    if (effect.type === "travel_to") {
      upsertLocation(ctx, effect.locationId);
      continue;
    }
    if (effect.type === "open_command_mode") {
      openCommandModeInternal(ctx, effect.scenarioId, {
        returnTab: effect.returnTab,
        sourceTab,
      });
      continue;
    }
    if (effect.type === "open_battle_mode") {
      openBattleModeInternal(ctx, effect.scenarioId, {
        returnTab: effect.returnTab,
        sourceTab,
        sourceContextId: source?.sourceId,
        sourceScenarioId: extractSourceScenarioId(source),
      });
      continue;
    }
    if (effect.type === "spawn_map_event") {
      spawnMapEventInternal(ctx, effect.templateId, {
        ttlMinutes: effect.ttlMinutes,
      });
      continue;
    }
    if (effect.type === "track_event") {
      emitTelemetry(ctx, effect.eventName, effect.tags ?? {}, effect.value);
      continue;
    }
    if (effect.type === "discover_fact") {
      discoverFactInternal(ctx, effect.caseId, effect.factId, {
        sourceType: source?.sourceType ?? "vn_effect",
        sourceId: source?.sourceId ?? `${effect.caseId}::${effect.factId}`,
      });
      continue;
    }
    if (effect.type === "unlock_mind_thought") {
      upsertFlag(ctx, `mind_unlocked::${effect.thoughtId}`, true);
      emitTelemetry(ctx, "mind_thought_unlocked", {
        thoughtId: effect.thoughtId,
        sourceType: source?.sourceType ?? "vn_effect",
        sourceId: source?.sourceId ?? effect.thoughtId,
      });
      continue;
    }
    if (effect.type === "shift_awakening") {
      const currentAwakening = getVar(ctx, MYSTIC_AWAKENING_VAR);
      const currentBuffer = Math.max(
        0,
        getVar(ctx, MYSTIC_RATIONALIST_BUFFER_VAR),
      );
      const dampening =
        effect.amount > 0 ? Math.min(effect.amount, currentBuffer) : 0;
      const nextAwakening = clampNumber(
        currentAwakening + effect.amount - dampening,
        0,
        100,
      );
      upsertVar(ctx, MYSTIC_AWAKENING_VAR, nextAwakening);
      if (dampening > 0) {
        upsertVar(
          ctx,
          MYSTIC_RATIONALIST_BUFFER_VAR,
          currentBuffer - dampening,
        );
      }
      if (effect.exposureDelta !== undefined) {
        upsertVar(
          ctx,
          MYSTIC_EXPOSURE_VAR,
          Math.max(0, getVar(ctx, MYSTIC_EXPOSURE_VAR) + effect.exposureDelta),
        );
      }
      continue;
    }
    if (effect.type === "record_entity_observation") {
      upsertFlag(ctx, `mystic_obs_${effect.observationId}`, true);
      if (effect.entityArchetypeId) {
        upsertFlag(ctx, `mystic_entity_${effect.entityArchetypeId}`, true);
      }
      for (const signatureId of effect.signatureIds ?? []) {
        upsertFlag(ctx, `mystic_signature_${signatureId}`, true);
      }
      continue;
    }
    if (effect.type === "unlock_distortion_point") {
      upsertFlag(ctx, `mystic_distortion_${effect.pointId}`, true);
      continue;
    }
    if (effect.type === "set_sight_mode") {
      upsertVar(ctx, MYSTIC_SIGHT_MODE_VAR, sightModeTier(effect.mode));
      continue;
    }
    if (effect.type === "apply_rationalist_buffer") {
      const nextBuffer = Math.max(
        0,
        getVar(ctx, MYSTIC_RATIONALIST_BUFFER_VAR) + effect.amount,
      );
      upsertVar(ctx, MYSTIC_RATIONALIST_BUFFER_VAR, nextBuffer);
      continue;
    }
    if (effect.type === "tag_entity_signature") {
      upsertFlag(ctx, `mystic_signature_${effect.signatureId}`, true);
      continue;
    }
    if (effect.type === "change_psyche_axis") {
      addToVar(ctx, resolvePsycheVarKey(effect.axis), effect.delta);
      continue;
    }

    // New effects
    if (effect.type === "grant_xp") {
      addToVar(ctx, "xp_total", effect.amount);
      continue;
    }

    if (effect.type === "set_quest_stage") {
      const questKey = createQuestKey(ctx.sender, effect.questId);
      const existing = ctx.db.playerQuest.questKey.find(questKey);
      let appliedStage = existing?.stage ?? 0;
      if (existing) {
        if (effect.stage > existing.stage) {
          ctx.db.playerQuest.questKey.update({
            ...existing,
            stage: effect.stage,
            updatedAt: ctx.timestamp,
          });
          appliedStage = effect.stage;
        }
      } else {
        ctx.db.playerQuest.insert({
          questKey,
          playerId: ctx.sender,
          questId: effect.questId,
          stage: effect.stage,
          updatedAt: ctx.timestamp,
        });
        appliedStage = effect.stage;
      }
      syncAgencyCareerQualifyingCase(ctx, effect.questId, appliedStage);
      continue;
    }

    if (effect.type === "change_relationship") {
      changeRelationshipTrust(ctx, effect.characterId, effect.delta);
      continue;
    }

    if (effect.type === "change_favor_balance") {
      changeFavorBalanceInternal(
        ctx,
        effect.npcId,
        effect.delta,
        effect.reason,
      );
      continue;
    }

    if (effect.type === "change_agency_standing") {
      changeAgencyStandingInternal(ctx, effect.delta, effect.reason);
      continue;
    }

    if (effect.type === "change_faction_signal") {
      changeFactionSignalInternal(
        ctx,
        effect.factionId,
        effect.delta,
        effect.reason,
      );
      continue;
    }

    if (effect.type === "register_rumor") {
      registerRumorInternal(ctx, effect.rumorId);
      continue;
    }

    if (effect.type === "verify_rumor") {
      verifyRumorInternal(ctx, effect.rumorId, effect.verificationKind);
      continue;
    }

    if (effect.type === "record_service_criterion") {
      recordServiceCriterionInternal(ctx, effect.criterionId);
      continue;
    }

    if (effect.type === "unlock_group") {
      const unlockKey = createUnlockGroupKey(ctx.sender, effect.groupId);
      if (!ctx.db.playerUnlockGroup.unlockKey.find(unlockKey)) {
        ctx.db.playerUnlockGroup.insert({
          unlockKey,
          playerId: ctx.sender,
          groupId: effect.groupId,
          unlockedAt: ctx.timestamp,
        });
      }
      continue;
    }

    if (effect.type === "grant_evidence") {
      const evidenceKey = createEvidenceKey(ctx.sender, effect.evidenceId);
      if (!ctx.db.playerEvidence.evidenceKey.find(evidenceKey)) {
        ctx.db.playerEvidence.insert({
          evidenceKey,
          playerId: ctx.sender,
          evidenceId: effect.evidenceId,
          discoveredAt: ctx.timestamp,
        });
      }
      continue;
    }

    if (effect.type === "grant_item") {
      const inventoryKey = createInventoryKey(ctx.sender, effect.itemId);
      const existing = ctx.db.playerInventory.inventoryKey.find(inventoryKey);
      if (existing) {
        ctx.db.playerInventory.inventoryKey.update({
          ...existing,
          quantity: existing.quantity + effect.quantity,
          updatedAt: ctx.timestamp,
        });
      } else {
        ctx.db.playerInventory.insert({
          inventoryKey,
          playerId: ctx.sender,
          itemId: effect.itemId,
          quantity: effect.quantity,
          updatedAt: ctx.timestamp,
        });
      }
      continue;
    }

    if (effect.type === "add_heat") {
      addToVar(ctx, "heat", effect.amount);
      continue;
    }

    if (effect.type === "add_tension") {
      addToVar(ctx, "tension", effect.amount);
      continue;
    }

    if (effect.type === "grant_influence") {
      addToVar(ctx, "influence_points", effect.amount);
      continue;
    }

    if (effect.type === "subjugate_spirit") {
      upsertSpiritStateInternal(ctx, effect.spiritId, "controlled", "dialogue");
      continue;
    }

    if (effect.type === "destroy_spirit") {
      upsertSpiritStateInternal(ctx, effect.spiritId, "destroyed");
      continue;
    }

    if (effect.type === "imprison_spirit") {
      upsertSpiritStateInternal(
        ctx,
        effect.spiritId,
        "imprisoned",
        "ritual",
        effect.requiredItemId,
      );
      continue;
    }

    if (effect.type === "release_spirit") {
      upsertSpiritStateInternal(ctx, effect.spiritId, "hostile");
      continue;
    }
  }
};
