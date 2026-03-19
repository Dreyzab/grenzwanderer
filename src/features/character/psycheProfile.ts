import {
  LEGACY_LAYER_BY_FACTION_ID,
  LEGACY_REPUTATION_VAR_BY_FACTION_ID,
  MAX_ALIGNMENT_CONTRIBUTION,
  MAX_ALIGNMENT_FACTIONS_PER_LAYER,
  getFactionCatalog,
  type FactionDefinition,
  type FactionLayer,
  type FactionRevealReason,
} from "../../../data/factionContract";
import {
  buildMysticStateSummary,
  formatSightModeLabel,
} from "../mysticism/model/mysticism";
import { getFactionSignalPresentation } from "../../shared/game/socialPresentation";

export interface PsycheProfileInput {
  flags: Record<string, boolean>;
  vars: Record<string, number>;
  factionCatalog?: FactionDefinition[];
  factionSignals?: Array<{
    factionId: string;
    value: number;
    trend?: string;
  }>;
  revealedFactionIds?: string[];
  revealedFactionReasons?: Partial<Record<string, FactionRevealReason>>;
}

type AlignmentTier =
  | "unaligned"
  | "daylight"
  | "political"
  | "shadow"
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
  revealReason?: FactionRevealReason;
  provenanceNote?: string;
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

const LAYERS: FactionLayer[] = ["daylight", "political", "shadow"];
const LEGACY_FACTION_IDS = Object.keys(LEGACY_LAYER_BY_FACTION_ID) as Array<
  keyof typeof LEGACY_LAYER_BY_FACTION_ID
>;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const getAlignmentCopy = (
  tier: Exclude<AlignmentTier, "contested" | "unaligned">,
) => {
  if (tier === "daylight") {
    return {
      label: "Daylight Current",
      description:
        "Workshops, care, study, and civic routines are now the clearest social current around your case.",
    };
  }
  if (tier === "political") {
    return {
      label: "Political Current",
      description:
        "Elite leverage and institutional bargaining are shaping the strongest pressure around your investigation.",
    };
  }
  return {
    label: "Shadow Current",
    description:
      "Informal networks and off-ledger city pressure now define the strongest pull around your investigation.",
  };
};

const resolveAlignment = ({
  factionCatalog,
  factionSignals,
  vars,
}: {
  factionCatalog: FactionDefinition[];
  factionSignals: Array<{
    factionId: string;
    value: number;
    trend?: string;
  }>;
  vars: Record<string, number>;
}): PsycheAlignmentSummary => {
  const signalById = new Map(
    factionSignals.map((entry) => [entry.factionId, entry] as const),
  );
  const layerScores = LAYERS.map((layer) => {
    const canonicalContributions = factionCatalog
      .filter(
        (entry) =>
          entry.visibility === "public" &&
          entry.layer === layer &&
          entry.id !== "the_returned",
      )
      .map((entry) => {
        const value = signalById.get(entry.id)?.value ?? 0;
        return clamp(Math.max(value, 0), 0, MAX_ALIGNMENT_CONTRIBUTION);
      })
      .filter((value) => value > 0)
      .sort((left, right) => right - left)
      .slice(0, MAX_ALIGNMENT_FACTIONS_PER_LAYER);

    const canonicalScore = canonicalContributions.reduce(
      (sum, value) => sum + value,
      0,
    );
    if (canonicalScore > 0) {
      return { layer, score: canonicalScore };
    }

    const legacyFactionId = LEGACY_FACTION_IDS.find(
      (entry) => LEGACY_LAYER_BY_FACTION_ID[entry] === layer,
    );
    if (!legacyFactionId) {
      return { layer, score: 0 };
    }

    const legacyRow = signalById.get(legacyFactionId);
    const legacyValue =
      legacyRow?.value ??
      vars[LEGACY_REPUTATION_VAR_BY_FACTION_ID[legacyFactionId]] ??
      0;

    return {
      layer,
      score: clamp(Math.max(legacyValue, 0), 0, MAX_ALIGNMENT_CONTRIBUTION),
    };
  }).sort((left, right) => right.score - left.score);

  const leader = layerScores[0];
  const runnerUp = layerScores[1];

  if (!leader || leader.score < 1) {
    return {
      tier: "unaligned",
      label: "Unaligned Observer",
      description:
        "You are still moving between Freiburg's social layers without belonging clearly to any one current.",
    };
  }

  if (runnerUp && Math.abs(leader.score - runnerUp.score) <= 5) {
    return {
      tier: "contested",
      label: "Contested Pressure",
      description:
        "Daylight, political, and shadow pressures are close enough that your position still feels volatile.",
    };
  }

  const alignmentCopy = getAlignmentCopy(leader.layer);
  return {
    tier: leader.layer,
    label: alignmentCopy.label,
    description: alignmentCopy.description,
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
  const factionCatalog = input.factionCatalog
    ? [...input.factionCatalog].sort((left, right) => left.order - right.order)
    : getFactionCatalog();
  const signalById = new Map(
    (input.factionSignals ?? []).map(
      (entry) => [entry.factionId, entry] as const,
    ),
  );
  const revealedFactionIds = new Set(
    input.revealedFactionIds ??
      factionCatalog
        .filter((entry) => entry.visibility === "public")
        .filter((entry) => signalById.has(entry.id))
        .map((entry) => entry.id),
  );

  const factionSignals: PsycheFactionSignal[] = factionCatalog
    .filter((entry) => entry.visibility === "public")
    .filter((entry) => revealedFactionIds.has(entry.id))
    .map((entry) => {
      const signal = signalById.get(entry.id);
      const presentation = getFactionSignalPresentation(
        entry.id,
        signal?.value ?? 0,
        signal?.trend,
        { factions: factionCatalog },
      );
      const revealReason = input.revealedFactionReasons?.[entry.id];

      return {
        ...presentation,
        revealReason,
        provenanceNote:
          revealReason === "pressure"
            ? "You have already felt this milieu pressing on the case."
            : undefined,
      };
    });

  return {
    alignment: resolveAlignment({
      factionCatalog,
      factionSignals: input.factionSignals ?? [],
      vars: input.vars,
    }),
    factionSignals,
    secrets: resolveSecrets(input.flags),
    evolutionTracks: resolveTracks(input.vars),
    checks: resolveChecks(input.vars),
    mysticism: resolveMysticism(input.vars),
  };
};
