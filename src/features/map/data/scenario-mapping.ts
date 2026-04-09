import {
  CASE01_DEFAULT_ENTRY_SCENARIO_ID,
  CASE01_SCENARIO_IDS,
} from "../../../shared/case01Canon";

const LEGACY_SCENARIO_TO_CURRENT: Record<string, string | null> = {
  detective_case1_hbf_arrival: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
  detective_case1_bank_scene: CASE01_SCENARIO_IDS.bankInvestigation,
  detective_case1_alt_briefing: CASE01_SCENARIO_IDS.mayorBriefing,
  detective_case1_mayor_followup: CASE01_SCENARIO_IDS.convergence,
  detective_case1_archive_search: CASE01_SCENARIO_IDS.archiveRun,
  detective_case1_lab_analysis: CASE01_SCENARIO_IDS.estateBranch,
  detective_case1_qr_scan_bank: CASE01_SCENARIO_IDS.bankInvestigation,
  case1_finale: CASE01_SCENARIO_IDS.warehouseFinale,
  lead_tailor: CASE01_SCENARIO_IDS.leadTailor,
  lead_apothecary: CASE01_SCENARIO_IDS.leadApothecary,
  lead_pub: CASE01_SCENARIO_IDS.leadPub,
  interlude_victoria_street: CASE01_SCENARIO_IDS.convergence,
  interlude_lotte_warning: CASE01_SCENARIO_IDS.lotteInterlude,
  quest_lotte_wires: null,
  quest_victoria_poetry: null,
  encounter_tourist: "sandbox_intro_pilot",
  encounter_cleaner: "sandbox_intro_pilot",
  encounter_student: "sandbox_intro_pilot",
};

export const resolveLegacyScenarioId = (
  legacyScenarioId: string,
): string | undefined => LEGACY_SCENARIO_TO_CURRENT[legacyScenarioId] ?? undefined;

export const resolveScenarioForPoint = (
  legacyScenarioIds: readonly string[] | undefined,
  availableScenarioIds: ReadonlySet<string>,
): string | null => {
  if (!legacyScenarioIds || legacyScenarioIds.length === 0) {
    return null;
  }

  for (const legacyScenarioId of legacyScenarioIds) {
    const mappedId = resolveLegacyScenarioId(legacyScenarioId);
    if (!mappedId) {
      continue;
    }
    if (!availableScenarioIds.has(mappedId)) {
      continue;
    }
    return mappedId;
  }

  return null;
};
