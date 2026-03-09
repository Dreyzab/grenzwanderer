import {
  buildMysticStateSummary,
  formatSightModeLabel,
} from "../mysticism/model/mysticism";
import { getFactionSignalPresentation } from "../../shared/game/socialPresentation";

export interface PsycheProfileInput {
  flags: Record<string, boolean>;
  vars: Record<string, number>;
  factionSignals?: Array<{
    factionId: string;
    value: number;
    trend?: string;
  }>;
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
  factionId: string;
  label: string;
  stateLabel: string;
  trendLabel: string;
  intensityPercent: number;
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

export interface PsycheMysticismSummary {
  awakeningLevel: number;
  band: string;
  bandLabel: string;
  bandDescription: string;
  mysticExposure: number;
  rationalism: number;
  rationalistBuffer: number;
  sightMode: string;
  sightModeLabel: string;
}

export interface PsycheProfileData {
  alignment: PsycheAlignmentSummary;
  factionSignals: PsycheFactionSignal[];
  secrets: PsycheSecretState[];
  evolutionTracks: PsycheEvolutionTrack[];
  checks: PsycheChecksSummary;
  mysticism: PsycheMysticismSummary;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const factionMeta: Array<{ factionId: string; fallbackVarKey: string }> = [
  { factionId: "civic_order", fallbackVarKey: "rep_civic" },
  { factionId: "underworld", fallbackVarKey: "rep_underworld" },
  { factionId: "financial_bloc", fallbackVarKey: "rep_finance" },
];

const resolveAlignment = (
  signals: Array<{ factionId: string; value: number }>,
): PsycheAlignmentSummary => {
  const ranked = [...signals].sort((left, right) => right.value - left.value);
  const leader = ranked[0];
  const runnerUp = ranked[1];

  if (!leader || leader.value < 1) {
    return {
      tier: "unaligned",
      label: "Unaligned Observer",
      description:
        "You are still collecting leverage without committing to a bloc.",
    };
  }

  if (runnerUp && Math.abs(leader.value - runnerUp.value) <= 5) {
    return {
      tier: "contested",
      label: "Contested Alignment",
      description:
        "Multiple factions are close in influence. Pressure is volatile.",
    };
  }

  if (leader.factionId === "civic_order") {
    return {
      tier: "civic_order",
      label: "Civic Order",
      description:
        "Procedure and institutions are shaping your investigation path.",
    };
  }

  if (leader.factionId === "underworld") {
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

const resolveMysticism = (
  vars: Record<string, number>,
): PsycheMysticismSummary => {
  const mysticState = buildMysticStateSummary(vars);

  return {
    awakeningLevel: mysticState.awakeningLevel,
    band: mysticState.awakeningBand,
    bandLabel: mysticState.awakeningBandLabel,
    bandDescription: mysticState.awakeningBandDescription,
    mysticExposure: mysticState.mysticExposure,
    rationalism: mysticState.rationalism,
    rationalistBuffer: mysticState.rationalistBuffer,
    sightMode: mysticState.activeSightMode,
    sightModeLabel: formatSightModeLabel(mysticState.activeSightMode),
  };
};

export const buildPsycheProfile = (
  input: PsycheProfileInput,
): PsycheProfileData => {
  const signalValues = factionMeta.map((meta) => {
    const canonicalRow = input.factionSignals?.find(
      (entry) => entry.factionId === meta.factionId,
    );
    return {
      factionId: meta.factionId,
      value: canonicalRow?.value ?? input.vars[meta.fallbackVarKey] ?? 0,
      trend: canonicalRow?.trend ?? "stable",
    };
  });

  const factionSignals: PsycheFactionSignal[] = signalValues.map((entry) =>
    getFactionSignalPresentation(entry.factionId, entry.value, entry.trend),
  );

  return {
    alignment: resolveAlignment(signalValues),
    factionSignals,
    secrets: resolveSecrets(input.flags),
    evolutionTracks: resolveTracks(input.vars),
    checks: resolveChecks(input.vars),
    mysticism: resolveMysticism(input.vars),
  };
};
