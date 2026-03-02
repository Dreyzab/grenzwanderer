const LEGACY_SCENARIO_TO_CURRENT: Record<string, string> = {
  detective_case1_hbf_arrival: "sandbox_case01_pilot",
  detective_case1_bank_scene: "sandbox_case01_pilot",
  detective_case1_alt_briefing: "sandbox_case01_pilot",
  detective_case1_mayor_followup: "sandbox_case01_pilot",
  detective_case1_archive_search: "sandbox_case01_pilot",
  detective_case1_lab_analysis: "sandbox_case01_pilot",
  detective_case1_qr_scan_bank: "sandbox_case01_pilot",
  case1_finale: "sandbox_case01_pilot",
  lead_tailor: "sandbox_case01_pilot",
  lead_apothecary: "sandbox_case01_pilot",
  lead_pub: "sandbox_case01_pilot",
  interlude_victoria_street: "sandbox_case01_pilot",
  interlude_lotte_warning: "sandbox_case01_pilot",
  quest_lotte_wires: "sandbox_case01_pilot",
  quest_victoria_poetry: "sandbox_case01_pilot",
  encounter_tourist: "sandbox_intro_pilot",
  encounter_cleaner: "sandbox_intro_pilot",
  encounter_student: "sandbox_intro_pilot",
};

export const resolveLegacyScenarioId = (
  legacyScenarioId: string,
): string | undefined => LEGACY_SCENARIO_TO_CURRENT[legacyScenarioId];

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
