import type { VnContractMetadata } from "./types";

export const VN_CONTRACT_VERSION = 1;

export const VN_CONDITION_TYPES = [
  "agency_standing_gte",
  "career_rank_gte",
  "favor_balance_gte",
  "flag_equals",
  "has_controlled_spirit",
  "has_evidence",
  "has_item",
  "hypothesis_focus_is",
  "logic_and",
  "logic_not",
  "logic_or",
  "quest_stage_gte",
  "relationship_gte",
  "rumor_state_is",
  "spirit_state_is",
  "thought_state_is",
  "var_gte",
  "var_lte",
  "voice_level_gte",
] as const;

export const VN_EFFECT_TYPES = [
  "add_heat",
  "add_tension",
  "add_var",
  "apply_rationalist_buffer",
  "change_agency_standing",
  "change_faction_signal",
  "change_favor_balance",
  "change_psyche_axis",
  "change_relationship",
  "destroy_spirit",
  "discover_fact",
  "grant_evidence",
  "grant_influence",
  "grant_item",
  "grant_xp",
  "imprison_spirit",
  "open_battle_mode",
  "open_command_mode",
  "record_entity_observation",
  "record_service_criterion",
  "register_rumor",
  "release_spirit",
  "set_flag",
  "set_quest_stage",
  "set_sight_mode",
  "set_var",
  "shift_awakening",
  "spawn_map_event",
  "subjugate_spirit",
  "tag_entity_signature",
  "track_event",
  "travel_to",
  "unlock_distortion_point",
  "unlock_group",
  "unlock_mind_thought",
  "verify_rumor",
] as const;

export type VnConditionType = (typeof VN_CONDITION_TYPES)[number];
export type VnEffectType = (typeof VN_EFFECT_TYPES)[number];

export const VN_CONDITION_TYPE_SET: ReadonlySet<string> = new Set(
  VN_CONDITION_TYPES,
);
export const VN_EFFECT_TYPE_SET: ReadonlySet<string> = new Set(VN_EFFECT_TYPES);

const hasSameSortedValues = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  left.every((entry, index) => entry === right[index]);

export const createVnContractMetadata = (): VnContractMetadata => ({
  contractVersion: VN_CONTRACT_VERSION,
  vocabulary: {
    conditions: [...VN_CONDITION_TYPES],
    effects: [...VN_EFFECT_TYPES],
  },
});

export const isVnContractMetadata = (
  value: unknown,
): value is VnContractMetadata => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const metadata = value as Record<string, unknown>;
  const vocabulary = metadata.vocabulary as Record<string, unknown> | undefined;
  const expected = createVnContractMetadata();

  return (
    metadata.contractVersion === VN_CONTRACT_VERSION &&
    typeof vocabulary === "object" &&
    vocabulary !== null &&
    Array.isArray(vocabulary.conditions) &&
    Array.isArray(vocabulary.effects) &&
    vocabulary.conditions.every((entry) => typeof entry === "string") &&
    vocabulary.effects.every((entry) => typeof entry === "string") &&
    hasSameSortedValues(
      vocabulary.conditions,
      expected.vocabulary.conditions,
    ) &&
    hasSameSortedValues(vocabulary.effects, expected.vocabulary.effects)
  );
};
