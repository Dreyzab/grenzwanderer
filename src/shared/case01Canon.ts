export const CASE01_DEFAULT_ENTRY_SCENARIO_ID = "case01_hbf_arrival";

export const CASE01_SCENARIO_IDS = {
  defaultEntry: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
  mayorBriefing: "case01_mayor_briefing",
  bankInvestigation: "case01_bank_investigation",
  leadTailor: "case01_lead_tailor",
  leadApothecary: "case01_lead_apothecary",
  leadPub: "case01_lead_pub",
  falseTrailWorkers: "case01_false_trail_workers",
  falseTrailPostRoute: "case01_false_trail_post_route",
  falseTrailGrimoire: "case01_false_trail_grimoire",
  falseTrailConvergence: "case01_false_trail_convergence",
  estateBranch: "case01_estate_branch",
  lotteInterlude: "case01_lotte_interlude",
  lodgingZumGoldenenAdler: "case01_lodging_zum_goldenen_adler",
  convergence: "case01_convergence",
  archiveRun: "case01_archive_warrant_run",
  railYardTail: "case01_rail_yard_shadow_tail",
  warehouseFinale: "case01_warehouse_finale",
} as const;

export const CASE01_ROUTE_VALUE_OFFICIAL = 1;
export const CASE01_ROUTE_VALUE_COVERT = 2;

export const CASE01_FINAL_OUTCOME_LAWFUL = 1;
export const CASE01_FINAL_OUTCOME_COMPROMISED = 2;

export const CASE01_DINING_NODE_IDS = {
  intro: "scene_case01_train_dining_car_intro",
  mother: "scene_case01_train_dining_car_mother",
  motherMonologueHappiness:
    "scene_case01_train_dining_car_lotte_monologue_happiness",
  motherMonologueChosen: "scene_case01_train_dining_car_lotte_monologue_chosen",
  motherReaction: "scene_case01_train_dining_car_mother_reaction",
  marriageJoke: "scene_case01_train_dining_car_marriage_joke",
  silentBranch: "scene_case01_train_dining_car_silent_branch",
  introSelfBranch: "scene_case01_train_dining_car_intro_self_branch",
  hotelBranch: "scene_case01_train_dining_car_hotel_branch",
  wineBeat: "scene_case01_train_dining_car_wine_beat",
  felixInterrupts: "scene_case01_train_dining_car_felix_interrupts",
  eleonoraFarewell: "scene_case01_train_dining_car_eleonora_farewell",
} as const;

/**
 * Canonical Train Hub overlay constants. The hub node is the single
 * point in the rail scenario where the player can roam between wagons
 * via an interactive schematic. See {@link CASE01_TRAIN_HUB_ZONE_IDS}
 * for the four zones rendered inside the overlay and
 * {@link CASE01_TRAIN_HUB_ZONE_BY_SCENE_GROUP} for the mapping between
 * narrative scene groups and zone ids.
 */
export const CASE01_TRAIN_HUB_SCHEMA_ID = "train_hub";
export const CASE01_TRAIN_HUB_NODE_ID = "scene_case01_train_hub";

export const CASE01_TRAIN_HUB_ZONE_IDS = {
  compartment: "compartment",
  corridor: "corridor",
  diningCar: "dining_car",
  vestibule: "vestibule",
} as const;

export type Case01TrainHubZoneId =
  (typeof CASE01_TRAIN_HUB_ZONE_IDS)[keyof typeof CASE01_TRAIN_HUB_ZONE_IDS];

/**
 * Maps narrative `sceneGroupId` values to the canonical hub zone that
 * the player should be marked as occupying after that scene. Authors
 * stay free to omit a mapping for transient scenes (e.g. cutscenes)
 * that should not move the avatar.
 */
export const CASE01_TRAIN_HUB_ZONE_BY_SCENE_GROUP: Readonly<
  Record<string, Case01TrainHubZoneId>
> = Object.freeze({
  train_compartment: CASE01_TRAIN_HUB_ZONE_IDS.compartment,
  train_corridor: CASE01_TRAIN_HUB_ZONE_IDS.corridor,
  train_dining_car: CASE01_TRAIN_HUB_ZONE_IDS.diningCar,
  train_vestibule: CASE01_TRAIN_HUB_ZONE_IDS.vestibule,
});

/**
 * Hit-test paths for the train hub. Coordinates target the canonical schema
 * `viewBox "0 0 2400 1000"` and intentionally match the top-down interior
 * map at `/images/train_interior_eleanor_map.svg`.
 */
export const CASE01_TRAIN_HUB_VIEW_BOX = "0 0 2400 1000";
export const CASE01_TRAIN_HUB_ASPECT_RATIO = 2.4;
export const CASE01_TRAIN_HUB_IMAGE_URL =
  "/images/train_interior_eleanor_map.svg";

export const CASE01_TRAIN_HUB_ZONE_PATHS: Readonly<
  Record<Case01TrainHubZoneId, string>
> = Object.freeze({
  [CASE01_TRAIN_HUB_ZONE_IDS.compartment]: "M80 240 H820 V780 H80 Z",
  [CASE01_TRAIN_HUB_ZONE_IDS.corridor]: "M820 280 H1320 V780 H820 Z",
  [CASE01_TRAIN_HUB_ZONE_IDS.diningCar]: "M1320 220 H2000 V780 H1320 Z",
  [CASE01_TRAIN_HUB_ZONE_IDS.vestibule]: "M2000 300 H2360 V780 H2000 Z",
});

export const CASE01_DINING_FLAGS = {
  jokedWithMother: "flag_joked_with_mother",
  silentObservation: "flag_silent_observation",
  introducedSelf: "flag_dining_intro_self",
  askedLodgingRoute: "flag_asked_lodging_route",
  askedZumGoldenenAdler: "flag_asked_zum_goldenen_adler",
  acceptedEleonoraHospitality: "flag_accepted_eleonora_hospitality",
  declinedEleonoraHospitality: "flag_declined_eleonora_hospitality",
  defendedFelix: "flag_defended_felix",
  metMother: "met_mother_intro",
  metFelix: "met_felix_intro",
  metRedhead: "met_redhead_intro",
  noticedRingRemoved: "noticed_eleonora_ring_removed",
  noticedFelixApathy: "noticed_felix_apathy",
  noticedLotteSchedule: "noticed_lotte_schedule",
} as const;

export const CASE01_CANON_FLAG_KEYS = [
  "bank_investigation_complete",
  "mayor_briefing_complete",
  "met_mayor_first",
  "tailor_lead_complete",
  "apothecary_lead_complete",
  "pub_lead_complete",
  "false_trail_workers_complete",
  "false_trail_workers_refuted",
  "false_trail_workers_pressure_used",
  "false_trail_post_route_complete",
  "false_trail_post_route_refuted",
  "false_trail_post_route_pressure_used",
  "false_trail_grimoire_complete",
  "false_trail_grimoire_refuted",
  "false_trail_grimoire_pressure_used",
  "false_trail_convergence_complete",
  "military_engineer_operation_proven",
  "estate_branch_complete",
  "lotte_interlude_complete",
  "lotte_warning_heeded",
  "warrant_ready",
  "covert_entry_ready",
  "warehouse_plan_locked",
  "case_resolved",
  "case01_resolved_lawful",
  "case01_resolved_compromise",
  "case02_hook_university_network",
  "convergence_gate_seen",
  "freiburg_case01_mainline_active",
  "fritz_contact_established",
  "fritz_platform_scan_complete",
  "case01_priority_locked",
  "case01_mayor_reward_notice_seen",
  "case01_forensics_reward_lead_seen",
  "case01_newsboy_read_as_picker",
  "case01_newsboy_caught",
  "case01_newsboy_spared",
  "case01_newsboy_handed_to_police",
  "case01_newsboy_thread_resolved",
  "case01_watch_stolen",
  "case01_watch_recovery_open",
  "case01_watch_reported_to_hbf_police",
  "case01_hbf_police_cover_suspected",
  "clerk_interviewed",
  "vault_inspected",
  "met_galdermann",
  "found_velvet",
  "found_residue",
  "bank_liquidity_gone_before_raid",
  "postal_workers_inside_too_long",
  "found_bank_contradiction",
  "police_refused_victoria",
  "victoria_introduced",
  "victoria_seen_in_bank",
  "victoria_respected",
  "bureau_trace_found",
  "mother_redhead_secret_potential",
  CASE01_DINING_FLAGS.metMother,
  CASE01_DINING_FLAGS.metFelix,
  CASE01_DINING_FLAGS.metRedhead,
  CASE01_DINING_FLAGS.jokedWithMother,
  CASE01_DINING_FLAGS.defendedFelix,
  CASE01_DINING_FLAGS.silentObservation,
  CASE01_DINING_FLAGS.introducedSelf,
  CASE01_DINING_FLAGS.askedLodgingRoute,
  CASE01_DINING_FLAGS.askedZumGoldenenAdler,
  CASE01_DINING_FLAGS.acceptedEleonoraHospitality,
  CASE01_DINING_FLAGS.declinedEleonoraHospitality,
  CASE01_DINING_FLAGS.noticedRingRemoved,
  CASE01_DINING_FLAGS.noticedFelixApathy,
  CASE01_DINING_FLAGS.noticedLotteSchedule,
  "flag_witch_coin_rebuke",
  "flag_witch_coin_joke",
  "flag_witch_coin_soft",
  "flag_witch_collar_command",
  "flag_witch_collar_joke",
  "flag_witch_collar_trust",
  "flag_witch_read_envelope_echo",
  "flag_witch_drank_brandy_early",
  "flag_witch_absorbed_hbf_blood",
  "flag_witch_helped_sasha_hbf",
  "flag_witch_took_suppressant",
  "flag_witch_siphoned_relic",
  "flag_witch_master_suspicious",
  "flag_witch_master_noticed_hbf_blood",
  "flag_spotted_fritz_early",
  "flag_witch_lotte_first_seen",
  "flag_witch_lotte_approached_directly",
  "flag_witch_lotte_composure_intro",
  "flag_witch_lotte_honest_intro",
  "flag_witch_lotte_social_intro",
  "flag_witch_lotte_cynic_intro",
  "flag_witch_lotte_authority_intro",
  "flag_witch_lotte_blood_sense_intro",
  "flag_witch_lotte_spark",
  "flag_witch_lotte_noticed_strangeness",
  "flag_witch_lotte_rational",
  "flag_witch_lotte_somatic",
  "flag_witch_lotte_marriage_match",
  "flag_witch_lotte_monologue_cynic",
  "flag_witch_lotte_monologue_grief",
  "flag_witch_lotte_monologue_practical",
  "flag_witch_lotte_good_parting",
  "flag_witch_baroness_deal",
  "flag_witch_baroness_suspicious",
  "flag_witch_ghost_freed",
  "flag_witch_ghost_bound",
  "flag_witch_ghost_banished",
  "flag_witch_mugger_survived",
  "flag_witch_mugger_killed",
  "flag_witch_maid_bribed",
  "flag_witch_dress_cleansed",
  "flag_witch_copper_smell",
  "flag_witch_felix_noticed_copper_smell",
  "flag_witch_somatic_exhaustion",
  "flag_witch_attacked_sasha",
  "witch_enter_ghost_sandbox",
  "met_bureau_master_intro",
  "met_sasha_servant_intro",
  "met_friedrich_wagner_intro",
  "met_krebs_mugger_intro",
  "met_hotel_maid_intro",
  "ghost_sasha_testimony_compromised",
] as const;

export const CASE01_CANON_VAR_KEYS = [
  "convergence_route",
  "case01_final_outcome",
  "official_writ_strength",
  "witch_blood_curse_pressure",
  "witch_alcohol_aftertaste",
  "lotte_warmth",
  "lotte_usefulness",
  "lotte_suspicion",
] as const;

export const CASE01_DIRECTOR_BRIDGE_FALLBACK_BEAT_IDS = Object.freeze([
  CASE01_SCENARIO_IDS.defaultEntry,
  CASE01_SCENARIO_IDS.mayorBriefing,
  CASE01_SCENARIO_IDS.bankInvestigation,
  CASE01_SCENARIO_IDS.leadTailor,
  CASE01_SCENARIO_IDS.leadApothecary,
  CASE01_SCENARIO_IDS.leadPub,
  CASE01_SCENARIO_IDS.falseTrailWorkers,
  CASE01_SCENARIO_IDS.falseTrailPostRoute,
  CASE01_SCENARIO_IDS.falseTrailGrimoire,
  CASE01_SCENARIO_IDS.falseTrailConvergence,
  CASE01_SCENARIO_IDS.estateBranch,
  CASE01_SCENARIO_IDS.lotteInterlude,
  CASE01_SCENARIO_IDS.lodgingZumGoldenenAdler,
  CASE01_SCENARIO_IDS.convergence,
  CASE01_SCENARIO_IDS.archiveRun,
  CASE01_SCENARIO_IDS.railYardTail,
  CASE01_SCENARIO_IDS.warehouseFinale,
] as const);

export type Case01DirectorAllowedBeatId =
  (typeof CASE01_DIRECTOR_BRIDGE_FALLBACK_BEAT_IDS)[number];

const CASE01_CANON_SCENARIO_ID_SET: ReadonlySet<string> = new Set(
  Object.values(CASE01_SCENARIO_IDS),
);

export const isCase01CanonScenarioId = (
  value: string,
): value is Case01DirectorAllowedBeatId =>
  CASE01_CANON_SCENARIO_ID_SET.has(value);

export const buildDirectorAllowedBeatIds = (
  snapshotScenarioIds?: readonly string[],
): readonly string[] => {
  const allowed = new Set<string>(CASE01_DIRECTOR_BRIDGE_FALLBACK_BEAT_IDS);
  if (snapshotScenarioIds) {
    for (const entry of snapshotScenarioIds) {
      if (isCase01CanonScenarioId(entry)) {
        allowed.add(entry);
      }
    }
  }
  return Object.freeze([...allowed]);
};

export const isCanonicalDirectorAllowedBeatList = (
  ids: readonly string[],
): boolean => {
  if (ids.length === 0) {
    return false;
  }
  for (const id of ids) {
    if (!isCase01CanonScenarioId(id)) {
      return false;
    }
  }
  return true;
};
