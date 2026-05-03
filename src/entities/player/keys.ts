import { LEGACY_REPUTATION_VAR_BY_FACTION_ID } from "../../../data/factionContract";
import {
  PSYCHE_VAR_KEYS,
  SKILL_VOICE_IDS,
} from "../../../data/innerVoiceContract";
import {
  RESOURCE_FORTUNE_MOD_VAR,
  RESOURCE_FORTUNE_VAR,
  RESOURCE_KARMA_VAR,
  RESOURCE_PROVIDENCE_VAR,
} from "../../shared/game/narrativeResources";
import {
  CASE01_CANON_FLAG_KEYS,
  CASE01_CANON_VAR_KEYS,
} from "../../shared/case01Canon";

const ORIGIN_FLAG_KEYS = [
  "ability_battlefield_memory",
  "ability_blue_blood_network",
  "ability_crime_scene_reconstruction",
  "ability_index_of_everything",
  "ability_nose_for_story",
  "char_creation_complete",
  "flaw_battle_scar_trigger",
  "flaw_cynic_mistrust",
  "flaw_gambling_addiction",
  "flaw_obsessive_archivist",
  "flaw_prideful_etiquette",
  "origin_archivist",
  "origin_aristocrat",
  "origin_detective",
  "origin_journalist",
  "origin_veteran",
] as const;

const SNAPSHOT_FLAG_KEYS = [
  "agency_briefing_complete",
  "agency_promotion_review_complete",
  "anna_knows_secret",
  "banker_case_closed",
  "banker_client_cooperative",
  "banker_client_hostile",
  "banker_finale_started",
  "banker_intro_seen",
  "banker_lead_house_checked",
  "banker_lead_tavern_checked",
  "banker_nervous_noticed",
  "case01_onboarding_complete",
  "case_banker_theft_solved",
  "city_bootblack_seen",
  "city_cleaner_seen",
  "city_student_seen",
  "clue_ledger_gap",
  "dog_case_closed",
  "dog_case_started",
  "dog_handler_proven",
  "dog_lead_market_done",
  "dog_lead_pub_done",
  "dog_lead_station_done",
  "dog_lead_tailor_done",
  "dog_lead_uni_done",
  "dog_market_route_confirmed",
  "dog_pub_tail_success",
  "dog_registry_found",
  "dog_reunion_reached",
  "dog_route_proven",
  "dog_station_log_obtained",
  "dog_tailor_intimidation",
  "dog_uni_registry_official",
  "dog_uni_registry_unofficial",
  "flag_bought_newspaper",
  "flag_caught_paperboy",
  "flag_investigated_station",
  "flag_paperboy_encounter",
  "flag_paperboy_mercy",
  "flag_paperboy_reported",
  "flag_paperboy_theft_seen",
  "flag_skipped_station_investigation",
  "freiburg_finale_open",
  "ghost_bookshelf_switch_found",
  "ghost_case_closed",
  "ghost_cold_spot_confirmed",
  "ghost_cold_spot_unclear",
  "ghost_draft_sensed",
  "ghost_ectoplasm_found",
  "ghost_route_unlocked",
  "ghost_thermometer_mastery",
  "ghost_thermometer_overreach",
  "ghost_truth_proven",
  "intro_freiburg_done",
  "karlsruhe_arrival_complete",
  "lang_de",
  "lang_en",
  "lang_ru",
  "met_anna_intro",
  "met_archivist_intro",
  "met_baroness_intro",
  "met_major_falk_intro",
  "missing_aroma_case_closed",
  "missing_aroma_case_started",
  "nose_for_story_triggered",
  "origin_archivist_handoff_done",
  "origin_aristocrat_handoff_done",
  "origin_detective_handoff_done",
  "origin_journalist_handoff_done",
  "origin_veteran_handoff_done",
  "priority_bank_first",
  "priority_mayor_first",
  "service_anna_student_intro_unlocked",
  "son_duel_done",
  "son_duel_lost",
  "son_duel_won",
  "student_house_accessed",
  "track_mythologist_tier1",
  "track_whistleblower_tier1",
  "used_shivers_intro",
  "veteran_flashback_controlled",
] as const;

const LEGACY_FLAG_KEYS = ["INTRO_COMPLETED"] as const;

const SNAPSHOT_VAR_KEYS = [
  "case_progress",
  "checks_failed",
  "checks_passed",
  "dog_case_confidence",
  "dog_leads_progress",
  "loop_demo_solved",
  "stress_index",
  "track_criminalist_xp",
  "track_duelist_xp",
  "track_dust_cartographer_xp",
  "track_hunter_xp",
  "track_investigator_xp",
  "track_ledgerkeeper_xp",
  "track_mythologist_xp",
  "track_occult_sleuth_xp",
  "track_shield_xp",
  "track_whistleblower_xp",
  "var_addiction_pressure",
] as const;

const RUNTIME_VAR_KEYS = [
  "agency_standing",
  "heat",
  "mystic_awakening",
  "mystic_exposure",
  "mystic_rationalist_buffer",
  "mystic_sight_mode_tier",
  "tension",
] as const;

export const PLAYER_FLAG_KEYS = [
  ...CASE01_CANON_FLAG_KEYS,
  ...ORIGIN_FLAG_KEYS,
  ...SNAPSHOT_FLAG_KEYS,
  ...LEGACY_FLAG_KEYS,
] as const;

export const PLAYER_VAR_KEYS = [
  ...CASE01_CANON_VAR_KEYS,
  ...SKILL_VOICE_IDS,
  ...PSYCHE_VAR_KEYS,
  ...Object.values(LEGACY_REPUTATION_VAR_BY_FACTION_ID),
  RESOURCE_PROVIDENCE_VAR,
  RESOURCE_FORTUNE_VAR,
  RESOURCE_FORTUNE_MOD_VAR,
  RESOURCE_KARMA_VAR,
  ...SNAPSHOT_VAR_KEYS,
  ...RUNTIME_VAR_KEYS,
] as const;

export type PlayerFlagKey = (typeof PLAYER_FLAG_KEYS)[number];
export type PlayerVarKey = (typeof PLAYER_VAR_KEYS)[number];

export interface PlayerKeyAlias {
  canonicalKey: PlayerFlagKey | PlayerVarKey;
  aliasKey: string;
  kind: "flag" | "var";
  removal: string;
}

export const PLAYER_KEY_ALIASES: readonly PlayerKeyAlias[] = [
  {
    kind: "flag",
    aliasKey: "INTRO_COMPLETED",
    canonicalKey: "intro_freiburg_done",
    removal:
      "Remove after all debug/demo surfaces stop checking uppercase intro state.",
  },
] as const satisfies readonly PlayerKeyAlias[];

const toSet = (keys: readonly string[]): ReadonlySet<string> => new Set(keys);

export const PLAYER_FLAG_KEY_SET = toSet(PLAYER_FLAG_KEYS);
export const PLAYER_VAR_KEY_SET = toSet(PLAYER_VAR_KEYS);

export const PLAYER_FLAG_ALIAS_SET = toSet(
  PLAYER_KEY_ALIASES.filter((entry) => entry.kind === "flag").map(
    (entry) => entry.aliasKey,
  ),
);
export const PLAYER_VAR_ALIAS_SET = toSet(
  PLAYER_KEY_ALIASES.filter((entry) => entry.kind === "var").map(
    (entry) => entry.aliasKey,
  ),
);

export const isKnownPlayerFlagKey = (key: string): key is PlayerFlagKey =>
  PLAYER_FLAG_KEY_SET.has(key) || PLAYER_FLAG_ALIAS_SET.has(key);

export const isKnownPlayerVarKey = (key: string): key is PlayerVarKey =>
  PLAYER_VAR_KEY_SET.has(key) || PLAYER_VAR_ALIAS_SET.has(key);
