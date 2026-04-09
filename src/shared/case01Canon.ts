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
  convergence: "case01_convergence",
  archiveRun: "case01_archive_warrant_run",
  railYardTail: "case01_rail_yard_shadow_tail",
  warehouseFinale: "case01_warehouse_finale",
} as const;

export const CASE01_ROUTE_VALUE_OFFICIAL = 1;
export const CASE01_ROUTE_VALUE_COVERT = 2;

export const CASE01_FINAL_OUTCOME_LAWFUL = 1;
export const CASE01_FINAL_OUTCOME_COMPROMISED = 2;

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
] as const;

export const CASE01_CANON_VAR_KEYS = [
  "convergence_route",
  "case01_final_outcome",
] as const;
