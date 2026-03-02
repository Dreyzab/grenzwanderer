export interface PsycheProfileInput {
  flags: Record<string, boolean>;
  vars: Record<string, number>;
}

type AlignmentTier =
  | "unaligned"
  | "civic_order"
  | "underworld"
  | "financial"
  | "contested";

export interface PsycheAlignmentSummary {
  tier: AlignmentTier;
  label: string;
  description: string;
}

export interface PsycheFactionSignal {
  key: string;
  label: string;
  reputation: number;
  color: string;
}

export interface PsycheSecretState {
  id: string;
  title: string;
  hint: string;
  unlocked: boolean;
}

export interface PsycheEvolutionTrack {
  id: string;
  title: string;
  progressPercent: number;
  note: string;
}

export interface PsycheChecksSummary {
  passed: number;
  failed: number;
  locked: number;
  confidencePercent: number;
}

export interface PsycheProfileData {
  alignment: PsycheAlignmentSummary;
  factionSignals: PsycheFactionSignal[];
  secrets: PsycheSecretState[];
  evolutionTracks: PsycheEvolutionTrack[];
  checks: PsycheChecksSummary;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const factionMeta: Array<{ key: string; label: string; color: string }> = [
  { key: "rep_civic", label: "Civic Order", color: "#2563eb" },
  { key: "rep_underworld", label: "Underworld", color: "#ea580c" },
  { key: "rep_finance", label: "Financial Bloc", color: "#ca8a04" },
];

const resolveAlignment = (
  signals: PsycheFactionSignal[],
): PsycheAlignmentSummary => {
  const ranked = [...signals].sort(
    (left, right) => right.reputation - left.reputation,
  );
  const leader = ranked[0];
  const runnerUp = ranked[1];

  if (!leader || leader.reputation < 1) {
    return {
      tier: "unaligned",
      label: "Unaligned Observer",
      description:
        "You are still collecting leverage without committing to a bloc.",
    };
  }

  if (runnerUp && Math.abs(leader.reputation - runnerUp.reputation) <= 0.5) {
    return {
      tier: "contested",
      label: "Contested Alignment",
      description:
        "Multiple factions are close in influence. Pressure is volatile.",
    };
  }

  if (leader.key === "rep_civic") {
    return {
      tier: "civic_order",
      label: "Civic Order",
      description:
        "Procedure and institutions are shaping your investigation path.",
    };
  }

  if (leader.key === "rep_underworld") {
    return {
      tier: "underworld",
      label: "Underworld Sympathizer",
      description:
        "Tunnel channels and unofficial actors now trust your methods.",
    };
  }

  return {
    tier: "financial",
    label: "Financial Compact",
    description:
      "Elite financial interests are now the strongest current in your case.",
  };
};

const resolveSecrets = (
  flags: Record<string, boolean>,
): PsycheSecretState[] => {
  const definitions: Array<
    Omit<PsycheSecretState, "unlocked"> & { flag: string }
  > = [
    {
      id: "secret_ledger_gap",
      title: "Ledger Discrepancy",
      hint: "Inspect records around the vault transfer windows.",
      flag: "clue_ledger_gap",
    },
    {
      id: "secret_shadow_witness",
      title: "Shadow Testimony",
      hint: "Push witnesses on timeline contradictions.",
      flag: "clue_shadow_witness",
    },
    {
      id: "secret_wire_access",
      title: "Wire Access",
      hint: "Secure operator cooperation to unlock communication relays.",
      flag: "intel_network_access",
    },
  ];

  return definitions
    .map((definition) => ({
      id: definition.id,
      title: definition.title,
      hint: definition.hint,
      unlocked: Boolean(flags[definition.flag]),
    }))
    .sort((left, right) => Number(right.unlocked) - Number(left.unlocked));
};

const resolveTracks = (
  vars: Record<string, number>,
): PsycheEvolutionTrack[] => {
  const caseProgress = clamp(vars.case_progress ?? 0, 0, 1);
  const intuitionLoad = clamp(vars.intuition_load ?? 0, 0, 1);
  const stressIndex = clamp(vars.stress_index ?? 0, 0, 1);

  return [
    {
      id: "track_case",
      title: "Case Arc",
      progressPercent: Math.round(caseProgress * 100),
      note:
        caseProgress >= 0.75
          ? "Endgame pressure: next choices will lock your outcome window."
          : "Investigation is still in progression; keep gathering reliable clues.",
    },
    {
      id: "track_intuition",
      title: "Intuition Pressure",
      progressPercent: Math.round(intuitionLoad * 100),
      note:
        intuitionLoad >= 0.7
          ? "Signals are converging rapidly. High chance of pivotal inference."
          : "Intuition channel remains stable with moderate cognitive load.",
    },
    {
      id: "track_stress",
      title: "Stress Index",
      progressPercent: Math.round(stressIndex * 100),
      note:
        stressIndex >= 0.8
          ? "Risk of volatile responses increased. Consider stabilizing actions."
          : "Stress remains manageable for controlled interrogations.",
    },
  ];
};

const resolveChecks = (vars: Record<string, number>): PsycheChecksSummary => {
  const passed = Math.max(0, Math.round(vars.checks_passed ?? 0));
  const failed = Math.max(0, Math.round(vars.checks_failed ?? 0));
  const locked = Math.max(0, Math.round(vars.checks_locked ?? 0));
  const resolved = passed + failed;

  return {
    passed,
    failed,
    locked,
    confidencePercent:
      resolved === 0 ? 0 : Math.round((passed / resolved) * 100),
  };
};

export const buildPsycheProfile = (
  input: PsycheProfileInput,
): PsycheProfileData => {
  const factionSignals: PsycheFactionSignal[] = factionMeta.map((meta) => ({
    key: meta.key,
    label: meta.label,
    color: meta.color,
    reputation: input.vars[meta.key] ?? 0,
  }));

  return {
    alignment: resolveAlignment(factionSignals),
    factionSignals,
    secrets: resolveSecrets(input.flags),
    evolutionTracks: resolveTracks(input.vars),
    checks: resolveChecks(input.vars),
  };
};
