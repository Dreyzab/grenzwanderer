export const CASE01_DEFAULT_ENTRY_SCENARIO_ID = "case01_hbf_arrival";

export const CASE01_SCENARIO_IDS = {
  defaultEntry: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
  mayorBriefing: "case01_mayor_briefing",
  bankInvestigation: "case01_bank_investigation",
  leadTailor: "case01_lead_tailor",
  leadApothecary: "case01_lead_apothecary",
  leadPub: "case01_lead_pub",
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
  marriageJoke: "scene_case01_train_dining_car_marriage_joke",
  silentBranch: "scene_case01_train_dining_car_silent_branch",
  introSelfBranch: "scene_case01_train_dining_car_intro_self_branch",
  hotelBranch: "scene_case01_train_dining_car_hotel_branch",
  wineBeat: "scene_case01_train_dining_car_wine_beat",
  felixInterrupts: "scene_case01_train_dining_car_felix_interrupts",
  eleonoraFarewell: "scene_case01_train_dining_car_eleonora_farewell",
} as const;

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
  "clerk_interviewed",
  "vault_inspected",
  "met_galdermann",
  "found_velvet",
  "found_residue",
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
  "flag_spotted_fritz_early",
] as const;

export const CASE01_CANON_VAR_KEYS = [
  "convergence_route",
  "case01_final_outcome",
] as const;
