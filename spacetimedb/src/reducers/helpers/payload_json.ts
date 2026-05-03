import { SenderError } from "spacetimedb/server";

import type {
  MindRequiredVar,
  MindVarOperator,
  VnEffect,
} from "../../../../src/shared/vn-contract";

export const assertNonEmpty = (value: string, fieldName: string): void => {
  if (!value || value.trim().length === 0) {
    throw new SenderError(`${fieldName} must not be empty`);
  }
};

export const asRecord = (
  value: unknown,
  fieldName: string,
): Record<string, unknown> => {
  if (!value || typeof value !== "object") {
    throw new SenderError(`${fieldName} must be an object`);
  }

  return value as Record<string, unknown>;
};

export const asStringArray = (value: unknown, fieldName: string): string[] => {
  if (
    !Array.isArray(value) ||
    !value.every((entry) => typeof entry === "string")
  ) {
    throw new SenderError(`${fieldName} must be an array of strings`);
  }

  return value;
};

export const asNumber = (value: unknown, fieldName: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new SenderError(`${fieldName} must be a finite number`);
  }

  return value;
};

export const asBoolean = (value: unknown, fieldName: string): boolean => {
  if (typeof value !== "boolean") {
    throw new SenderError(`${fieldName} must be a boolean`);
  }

  return value;
};

export const isVnEffect = (value: unknown): value is VnEffect => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const effect = value as Record<string, unknown>;
  if (effect.type === "set_flag") {
    return typeof effect.key === "string" && typeof effect.value === "boolean";
  }
  if (effect.type === "set_var" || effect.type === "add_var") {
    return typeof effect.key === "string" && typeof effect.value === "number";
  }
  if (effect.type === "travel_to") {
    return typeof effect.locationId === "string";
  }
  if (effect.type === "open_command_mode") {
    return (
      typeof effect.scenarioId === "string" &&
      (effect.returnTab === undefined ||
        effect.returnTab === "map" ||
        effect.returnTab === "vn")
    );
  }
  if (effect.type === "open_battle_mode") {
    return (
      typeof effect.scenarioId === "string" &&
      (effect.returnTab === undefined ||
        effect.returnTab === "map" ||
        effect.returnTab === "vn")
    );
  }
  if (effect.type === "spawn_map_event") {
    return (
      typeof effect.templateId === "string" &&
      (effect.ttlMinutes === undefined || typeof effect.ttlMinutes === "number")
    );
  }
  if (effect.type === "track_event") {
    return typeof effect.eventName === "string";
  }
  if (effect.type === "discover_fact") {
    return (
      typeof effect.caseId === "string" && typeof effect.factId === "string"
    );
  }
  if (effect.type === "unlock_mind_thought") {
    return typeof effect.thoughtId === "string";
  }
  if (effect.type === "grant_xp") {
    return typeof effect.amount === "number";
  }
  if (effect.type === "unlock_group") {
    return typeof effect.groupId === "string";
  }
  if (effect.type === "set_quest_stage") {
    return (
      typeof effect.questId === "string" && typeof effect.stage === "number"
    );
  }
  if (effect.type === "change_relationship") {
    return (
      typeof effect.characterId === "string" && typeof effect.delta === "number"
    );
  }
  if (effect.type === "change_favor_balance") {
    return (
      typeof effect.npcId === "string" &&
      typeof effect.delta === "number" &&
      (effect.reason === undefined || typeof effect.reason === "string")
    );
  }
  if (effect.type === "change_agency_standing") {
    return (
      typeof effect.delta === "number" &&
      (effect.reason === undefined || typeof effect.reason === "string")
    );
  }
  if (effect.type === "change_faction_signal") {
    return (
      typeof effect.factionId === "string" &&
      typeof effect.delta === "number" &&
      (effect.reason === undefined || typeof effect.reason === "string")
    );
  }
  if (effect.type === "register_rumor") {
    return typeof effect.rumorId === "string";
  }
  if (effect.type === "verify_rumor") {
    return (
      typeof effect.rumorId === "string" &&
      (effect.verificationKind === "evidence" ||
        effect.verificationKind === "fact" ||
        effect.verificationKind === "service_unlock" ||
        effect.verificationKind === "map_unlock")
    );
  }
  if (effect.type === "record_service_criterion") {
    return (
      effect.criterionId === "verified_rumor_chain" ||
      effect.criterionId === "preserved_source_network" ||
      effect.criterionId === "clean_closure"
    );
  }
  if (effect.type === "grant_evidence") {
    return typeof effect.evidenceId === "string";
  }
  if (effect.type === "grant_item") {
    return (
      typeof effect.itemId === "string" && typeof effect.quantity === "number"
    );
  }
  if (
    effect.type === "add_heat" ||
    effect.type === "add_tension" ||
    effect.type === "grant_influence"
  ) {
    return typeof effect.amount === "number";
  }
  if (effect.type === "shift_awakening") {
    return (
      typeof effect.amount === "number" &&
      (effect.exposureDelta === undefined ||
        typeof effect.exposureDelta === "number")
    );
  }
  if (effect.type === "record_entity_observation") {
    return (
      typeof effect.observationId === "string" &&
      (effect.entityArchetypeId === undefined ||
        typeof effect.entityArchetypeId === "string") &&
      (effect.signatureIds === undefined ||
        (Array.isArray(effect.signatureIds) &&
          effect.signatureIds.every((entry) => typeof entry === "string")))
    );
  }
  if (effect.type === "unlock_distortion_point") {
    return typeof effect.pointId === "string";
  }
  if (effect.type === "set_sight_mode") {
    return (
      effect.mode === "rational" ||
      effect.mode === "sensitive" ||
      effect.mode === "ether"
    );
  }
  if (effect.type === "apply_rationalist_buffer") {
    return typeof effect.amount === "number";
  }
  if (effect.type === "tag_entity_signature") {
    return typeof effect.signatureId === "string";
  }
  if (effect.type === "change_psyche_axis") {
    return (
      (effect.axis === "x" ||
        effect.axis === "y" ||
        effect.axis === "approach") &&
      typeof effect.delta === "number"
    );
  }

  return false;
};

const isMindVarOperator = (value: unknown): value is MindVarOperator =>
  value === "gte" || value === "lte" || value === "eq";

export const isMindRequiredVar = (value: unknown): value is MindRequiredVar => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const required = value as Record<string, unknown>;
  return (
    typeof required.key === "string" &&
    isMindVarOperator(required.op) &&
    typeof required.value === "number" &&
    Number.isFinite(required.value)
  );
};

export const parseRequiredFactIds = (requiredFactIdsJson: string): string[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(requiredFactIdsJson);
  } catch (_error) {
    throw new SenderError("requiredFactIdsJson must be valid JSON");
  }

  return asStringArray(parsed, "requiredFactIdsJson");
};

export const parseRequiredVars = (
  requiredVarsJson: string,
): MindRequiredVar[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(requiredVarsJson);
  } catch (_error) {
    throw new SenderError("requiredVarsJson must be valid JSON");
  }

  if (
    !Array.isArray(parsed) ||
    !parsed.every((entry) => isMindRequiredVar(entry))
  ) {
    throw new SenderError(
      "requiredVarsJson must be an array of {key, op, value}",
    );
  }

  return parsed;
};

export const parseRewardEffects = (rewardEffectsJson: string): VnEffect[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rewardEffectsJson);
  } catch (_error) {
    throw new SenderError("rewardEffectsJson must be valid JSON");
  }

  if (!Array.isArray(parsed) || !parsed.every((effect) => isVnEffect(effect))) {
    throw new SenderError(
      "rewardEffectsJson must be an array of valid effects",
    );
  }

  return parsed;
};

export const parseRequiredFactIdsJson = (
  requiredFactIdsJson: string,
): string[] => parseRequiredFactIds(requiredFactIdsJson);

export const parseRequiredVarsJson = (
  requiredVarsJson: string,
): MindRequiredVar[] => parseRequiredVars(requiredVarsJson);

export const parseRewardEffectsJson = (rewardEffectsJson: string): VnEffect[] =>
  parseRewardEffects(rewardEffectsJson);

export const parseTagsJsonObject = (
  tagsJson: string,
  fieldName: string,
): Record<string, unknown> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(tagsJson);
  } catch (_error) {
    throw new SenderError(`${fieldName} must be valid JSON`);
  }

  return asRecord(parsed, fieldName);
};

export const parseBoolean = (value: unknown, fieldName: string): boolean =>
  asBoolean(value, fieldName);

export const parseNumber = (value: unknown, fieldName: string): number =>
  asNumber(value, fieldName);
