import {
  INNER_VOICE_IDS as BASE_INNER_VOICE_IDS,
  PSYCHE_VAR_KEYS as BASE_PSYCHE_VAR_KEYS_ARRAY,
  SKILL_VOICE_IDS as BASE_SKILL_VOICE_IDS,
  SPEAKER_IDS as BASE_SPEAKER_IDS,
} from "../data/innerVoiceContract";
import { originProfiles } from "./origins.manifest";
import {
  CASE01_CANON_FLAG_KEYS,
  CASE01_CANON_VAR_KEYS,
} from "../src/shared/case01Canon";
import { VN_CONDITION_TYPES, VN_EFFECT_TYPES } from "../src/shared/vn-contract";

export const CONDITION_OPERATORS = new Set<string>(VN_CONDITION_TYPES);

export const EFFECT_OPERATORS = new Set<string>(VN_EFFECT_TYPES);

const BASE_FLAG_KEYS = new Set<string>([
  "agency_briefing_complete",
  "anna_knows_secret",
  "banker_client_cooperative",
  "banker_client_hostile",
  "banker_case_closed",
  "banker_finale_started",
  "banker_intro_seen",
  "banker_lead_house_checked",
  "banker_lead_tavern_checked",
  "banker_nervous_noticed",
  "case01_bridge_started",
  "case01_onboarding_complete",
  "case_banker_theft_solved",
  "char_creation_complete",
  "city_bootblack_seen",
  "city_cleaner_seen",
  "city_student_seen",
  "clue_ledger_gap",
  "dog_case_closed",
  "dog_case_started",
  "dog_lead_market_done",
  "dog_lead_pub_done",
  "dog_lead_station_done",
  "dog_lead_tailor_done",
  "dog_lead_uni_done",
  "dog_market_route_confirmed",
  "dog_pub_tail_success",
  "dog_registry_found",
  "dog_station_log_obtained",
  "dog_tailor_intimidation",
  "dog_uni_registry_official",
  "dog_uni_registry_unofficial",
  "son_duel_done",
  "son_duel_won",
  "son_duel_lost",
  "dog_handler_proven",
  "dog_reunion_reached",
  "dog_route_proven",
  "flag_bought_newspaper",
  "flag_caught_paperboy",
  "flag_investigated_station",
  "flag_paperboy_encounter",
  "flag_paperboy_mercy",
  "flag_paperboy_reported",
  "flag_paperboy_theft_seen",
  "flag_skipped_station_investigation",
  "flaw_battle_scar_trigger",
  "flaw_cynic_mistrust",
  "flaw_gambling_addiction",
  "flaw_obsessive_archivist",
  "flaw_prideful_etiquette",
  "freiburg_finale_open",
  "ghost_bookshelf_switch_found",
  "ghost_case_closed",
  "ghost_cold_spot_confirmed",
  "ghost_cold_spot_unclear",
  "ghost_draft_sensed",
  "ghost_ectoplasm_found",
  "ghost_route_unlocked",
  "ghost_truth_proven",
  "intro_freiburg_done",
  "karlsruhe_arrival_complete",
  "karlsruhe_event_entry_granted",
  "lang_de",
  "lang_en",
  "lang_ru",
  "loc_rathaus_unlocked",
  "met_anna_intro",
  "met_archivist_intro",
  "met_baroness_intro",
  "met_major_falk_intro",
  "missing_aroma_case_closed",
  "missing_aroma_case_started",
  "agency_promotion_review_complete",
  "nose_for_story_triggered",
  "origin_archivist_handoff_done",
  "origin_aristocrat_handoff_done",
  "origin_journalist",
  "origin_detective",
  "origin_detective_handoff_done",
  "origin_journalist_handoff_done",
  "origin_veteran_handoff_done",
  "detective_prologue_done",
  "priority_bank_first",
  "priority_mayor_first",
  "service_anna_student_intro_unlocked",
  "student_house_accessed",
  "track_mythologist_tier1",
  "track_whistleblower_tier1",
  "used_shivers_intro",
  "veteran_flashback_controlled",
]);

const SANDBOX_FLAG_KEYS = [
  "case_cityhall_infiltration_unlocked",
  "case_missing_courier_chain_of_custody_risk",
  "case_missing_courier_clock_is_political",
  "case_missing_courier_false_detention",
  "case_missing_courier_jurisdiction_breach",
  "case_missing_courier_network_damage",
  "case_missing_courier_no_false_arrest",
  "case_missing_courier_procedural_risk",
  "case_missing_courier_protocol_cover",
  "case_missing_courier_reputation_penalty",
  "case_missing_courier_resolved",
  "case_missing_courier_resolved_compromised",
  "case_missing_courier_resolved_partial",
  "case_missing_courier_resolved_success",
  "case_missing_courier_started",
  "cityhall_archive_target_known",
  "cityhall_infiltration_support_strong",
  "cityhall_infiltration_support_weak",
  "cityhall_infiltration_time_pressure",
  "cityhall_leak_chain_documented",
  "cityhall_leak_chain_incomplete",
  "cityhall_leak_confirmed",
  "courier_alibi_window_narrowed",
  "courier_chain_preserved",
  "courier_child_medical_debt_known",
  "courier_clue_registry",
  "courier_desperation_not_guilt",
  "courier_found_alive",
  "courier_handoff_timeline_verified",
  "courier_intercept_site_confirmed",
  "courier_motive_ambiguous",
  "courier_registry_overwrite_fresh",
  "courier_registry_tamper_theory",
  "courier_route_confirmed",
  "courier_scene_noise_high",
  "courier_second_rider_profiled",
  "courier_waybill_forged",
  "courier_waybill_stamp_copy_confirmed",
  "mayor_grimoire_thread_known",
];

for (const key of SANDBOX_FLAG_KEYS) {
  BASE_FLAG_KEYS.add(key);
}

const BASE_VAR_KEYS = new Set<string>([
  "attr_deception",
  "attr_empathy",
  "attr_encyclopedia",
  "attr_intellect",
  "attr_perception",
  "attr_physical",
  "attr_shadow",
  "attr_social",
  "attr_spirit",
  "case_progress",
  "checks_failed",
  "checks_passed",
  "dog_case_confidence",
  "dog_leads_progress",
  "heat",
  "influence_points",
  "rep_civic",
  "rep_finance",
  ...BASE_PSYCHE_VAR_KEYS_ARRAY,
  "stress_index",
  "tension",
  "track_mythologist_xp",
  "track_whistleblower_xp",
  "var_addiction_pressure",
  "xp_total",
  "loop_demo_solved",
]);

const SANDBOX_VAR_KEYS = [
  "case_missing_courier_evidence",
  "case_missing_courier_outcome",
];

for (const key of SANDBOX_VAR_KEYS) {
  BASE_VAR_KEYS.add(key);
}

const BASE_VOICE_IDS = new Set<string>(BASE_SKILL_VOICE_IDS);
const BASE_PSYCHE_VAR_KEY_SET = new Set<string>(BASE_PSYCHE_VAR_KEYS_ARRAY);
const BASE_INNER_SPEAKER_IDS = new Set<string>(BASE_INNER_VOICE_IDS);
const BASE_SPEAKER_POOL_IDS = new Set<string>(BASE_SPEAKER_IDS);

for (const flagKey of CASE01_CANON_FLAG_KEYS) {
  BASE_FLAG_KEYS.add(flagKey);
}

for (const varKey of CASE01_CANON_VAR_KEYS) {
  BASE_VAR_KEYS.add(varKey);
}

for (const profile of originProfiles) {
  BASE_FLAG_KEYS.add(profile.originFlagKey);
  BASE_FLAG_KEYS.add(profile.flawFlagKey);
  BASE_FLAG_KEYS.add(profile.signatureAbilityFlagKey);
  for (const track of profile.tracks) {
    BASE_FLAG_KEYS.add(track.tier1FlagKey);
    BASE_FLAG_KEYS.add(track.tier2FlagKey);
    BASE_VAR_KEYS.add(track.progressVarKey);
  }
  for (const stat of profile.statEffects) {
    BASE_VAR_KEYS.add(stat.key);
    BASE_VOICE_IDS.add(stat.key);
    BASE_SPEAKER_POOL_IDS.add(stat.key);
  }
}

export const FLAG_KEYS = BASE_FLAG_KEYS;
export const VAR_KEYS = BASE_VAR_KEYS;
export const PSYCHE_VAR_KEYS = BASE_PSYCHE_VAR_KEY_SET;
export const SKILL_VOICE_IDS = BASE_VOICE_IDS;
export const INNER_VOICE_IDS = BASE_INNER_SPEAKER_IDS;
export const SPEAKER_IDS = BASE_SPEAKER_POOL_IDS;
export const VOICE_IDS = SKILL_VOICE_IDS;

const levenshtein = (left: string, right: string): number => {
  if (left === right) {
    return 0;
  }
  if (left.length === 0) {
    return right.length;
  }
  if (right.length === 0) {
    return left.length;
  }

  const matrix = Array.from({ length: left.length + 1 }, () =>
    new Array<number>(right.length + 1).fill(0),
  );
  for (let i = 0; i <= left.length; i += 1) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= right.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
};

export const suggestClosest = (
  value: string,
  candidates: Iterable<string>,
  maxDistance = 2,
): string | null => {
  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const distance = levenshtein(value, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  if (!best || bestDistance > maxDistance) {
    return null;
  }

  return best;
};
