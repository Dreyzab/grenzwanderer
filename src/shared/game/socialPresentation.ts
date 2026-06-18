import {
  MIN_FACTION_PRESSURE_REVEAL,
  getFactionCatalog,
  getFactionDefinition,
  getPublicFactionCatalog,
  isCanonicalFactionId,
  type FactionCatalogSource,
  type FactionRevealReason,
} from "../../../data/factionContract";
import { clamp } from "../lib/clamp";
import type {
  CareerRankDefinition,
  FactionSignalTrend,
  NpcRuntimeIdentity,
  SocialCatalogSnapshot,
} from "../../features/vn/types";

export interface SocialBandPresentation {
  label: string;
  tone: "danger" | "warning" | "neutral" | "success" | "highlight";
}

export interface FavorPresentation {
  label: string;
  tone: SocialBandPresentation["tone"];
}

export interface FactionSignalPresentation {
  factionId: string;
  label: string;
  stateLabel: string;
  trendLabel: string;
  color: string;
  intensityPercent: number;
}

export interface RevealedFactionState {
  revealedFactionIds: string[];
  revealReasons: Partial<Record<string, FactionRevealReason>>;
}

type IdPresenceLookup = {
  has(id: string): boolean;
};

const TRUST_BANDS: Array<{
  min: number;
  label: string;
  tone: SocialBandPresentation["tone"];
}> = [
  { min: 60, label: "Ð¡Ð¾ÑŽÐ·Ð½Ð¸Ðº", tone: "highlight" },
  { min: 25, label: "ÐÐ°Ð´Ñ‘Ð¶Ð½Ñ‹Ð¹ ÐºÐ¾Ð½Ñ‚Ð°ÐºÑ‚", tone: "success" },
  { min: -9, label: "Ð Ð°Ð±Ð¾Ñ‡Ð¸Ð¹ ÐºÐ¾Ð½Ñ‚Ð°ÐºÑ‚", tone: "neutral" },
  {
    min: -39,
    label: "ÐÐ°Ð¿Ñ€ÑÐ¶Ñ‘Ð½Ð½Ð¾Ðµ Ð·Ð½Ð°ÐºÐ¾Ð¼ÑÑ‚Ð²Ð¾",
    tone: "warning",
  },
  { min: Number.NEGATIVE_INFINITY, label: "Ð§ÑƒÐ¶Ð¾Ð¹", tone: "danger" },
];

const AGENCY_STANDING_BANDS: Array<{
  min: number;
  label: string;
  tone: SocialBandPresentation["tone"];
}> = [
  { min: 70, label: "Ð›Ð¸Ñ†Ð¾ Ð°Ð³ÐµÐ½Ñ‚ÑÑ‚Ð²Ð°", tone: "highlight" },
  { min: 40, label: "Ð¦ÐµÐ½Ð½Ñ‹Ð¹ Ð°Ð³ÐµÐ½Ñ‚", tone: "success" },
  { min: 15, label: "ÐÐ°Ð´Ñ‘Ð¶Ð½Ñ‹Ð¹ ÑÐ¾Ñ‚Ñ€ÑƒÐ´Ð½Ð¸Ðº", tone: "neutral" },
  { min: -19, label: "ÐÐ° Ð¸ÑÐ¿Ñ‹Ñ‚Ð°Ð½Ð¸Ð¸", tone: "warning" },
  {
    min: Number.NEGATIVE_INFINITY,
    label: "ÐŸÐ¾Ð´ Ð½Ð°Ð±Ð»ÑŽÐ´ÐµÐ½Ð¸ÐµÐ¼",
    tone: "danger",
  },
];

const DEFAULT_SIGNAL_STATE_LABELS: [string, string, string] = [
  "Faint signal",
  "Cautious recognition",
  "Open signal",
];

const NEGATIVE_SIGNAL_STATE_LABELS: [string, string, string] = [
  "Quiet resistance",
  "Open friction",
  "Active hostility",
];

const FALLBACK_RANKS: CareerRankDefinition[] = [
  {
    id: "trainee",
    label: "Ð¡Ñ‚Ð°Ð¶Ñ‘Ñ€",
    order: 0,
    standingRequired: -100,
    serviceCriteriaNeeded: 0,
    privileges: [],
  },
  {
    id: "junior_detective",
    label: "ÐœÐ»Ð°Ð´ÑˆÐ¸Ð¹ Ð´ÐµÑ‚ÐµÐºÑ‚Ð¸Ð²",
    order: 1,
    standingRequired: 15,
    qualifyingCaseId: "quest_banker",
    serviceCriteriaNeeded: 2,
    privileges: [],
  },
  {
    id: "agency_detective",
    label: "Ð”ÐµÑ‚ÐµÐºÑ‚Ð¸Ð² Ð°Ð³ÐµÐ½Ñ‚ÑÑ‚Ð²Ð°",
    order: 2,
    standingRequired: 35,
    serviceCriteriaNeeded: 2,
    privileges: [],
  },
  {
    id: "senior_detective",
    label: "Ð¡Ñ‚Ð°Ñ€ÑˆÐ¸Ð¹ Ð´ÐµÑ‚ÐµÐºÑ‚Ð¸Ð²",
    order: 3,
    standingRequired: 55,
    serviceCriteriaNeeded: 2,
    privileges: [],
  },
  {
    id: "lead_investigator",
    label: "Ð’ÐµÐ´ÑƒÑ‰Ð¸Ð¹ ÑÐ»ÐµÐ´Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ",
    order: 4,
    standingRequired: 75,
    serviceCriteriaNeeded: 2,
    privileges: [],
  },
];

const formatIdentifier = (value: string): string =>
  value
    .replace(/^npc_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (entry) => entry.toUpperCase());

export const getNpcIdentity = (
  socialCatalog: SocialCatalogSnapshot | undefined,
  npcId: string,
): NpcRuntimeIdentity | undefined =>
  socialCatalog?.npcIdentities.find((entry) => entry.id === npcId);

export const getNpcDisplayName = (
  socialCatalog: SocialCatalogSnapshot | undefined,
  npcId: string,
): string =>
  getNpcIdentity(socialCatalog, npcId)?.displayName ?? formatIdentifier(npcId);

export const getTrustBandPresentation = (
  score: number,
): SocialBandPresentation =>
  TRUST_BANDS.find((entry) => score >= entry.min) ??
  TRUST_BANDS[TRUST_BANDS.length - 1];

export const getAgencyStandingPresentation = (
  score: number,
): SocialBandPresentation =>
  AGENCY_STANDING_BANDS.find((entry) => score >= entry.min) ??
  AGENCY_STANDING_BANDS[AGENCY_STANDING_BANDS.length - 1];

export const getTrendLabel = (
  trend: FactionSignalTrend | string | null | undefined,
): string => {
  if (trend === "rising") {
    return "Ð¢Ñ€ÐµÐ½Ð´: Ñ€Ð°ÑÑ‚Ñ‘Ñ‚";
  }
  if (trend === "falling") {
    return "Ð¢Ñ€ÐµÐ½Ð´: Ð¿Ð°Ð´Ð°ÐµÑ‚";
  }
  return "Ð¢Ñ€ÐµÐ½Ð´: ÑÑ‚Ð°Ð±Ð¸Ð»ÐµÐ½";
};

export const getFavorPresentation = (balance: number): FavorPresentation => {
  if (balance > 0) {
    return {
      label:
        balance === 1
          ? "ÐŸÐµÑ€ÑÐ¾Ð½Ð°Ð¶ Ð²Ð°Ð¼ Ð´Ð¾Ð»Ð¶ÐµÐ½"
          : `Ð”Ð¾Ð»Ð³ Ð¿ÐµÑ€ÐµÐ´ Ð²Ð°Ð¼Ð¸: ${balance}`,
      tone: "success",
    };
  }
  if (balance < 0) {
    return {
      label:
        balance === -1
          ? "Ð’Ñ‹ Ð´Ð¾Ð»Ð¶Ð½Ñ‹ ÑƒÑÐ»ÑƒÐ³Ñƒ"
          : `Ð’Ð°Ñˆ Ð´Ð¾Ð»Ð³: ${Math.abs(balance)}`,
      tone: "warning",
    };
  }
  return {
    label: "Ð‘Ð°Ð»Ð°Ð½Ñ ÑƒÑÐ»ÑƒÐ³ Ñ€Ð¾Ð²Ð½Ñ‹Ð¹",
    tone: "neutral",
  };
};

export const isNpcIdentityRevealed = (
  identity: Pick<NpcRuntimeIdentity, "id" | "introFlag">,
  flags: Record<string, boolean>,
  trustByNpcId: IdPresenceLookup,
  favorByNpcId: IdPresenceLookup,
): boolean => {
  if (!identity.introFlag) {
    return true;
  }

  return (
    flags[identity.introFlag] === true ||
    trustByNpcId.has(identity.id) ||
    favorByNpcId.has(identity.id)
  );
};

export interface NpcDossierStage {
  heading: string;
  text: string;
}

export interface NpcDossierEntry {
  id: string;
  displayName: string;
  publicRole: string;
  portraitUrl?: string;
  /** Tagline shown as soon as the NPC is met. */
  summary: string;
  /** Stages whose reveal flag is set (or that have no gate). */
  revealedStages: NpcDossierStage[];
  /** Count of still-locked stages, surfaced as a "more to learn" teaser. */
  lockedStageCount: number;
}

/**
 * Builds the player-facing dossier list for the journal: every met NPC that has
 * a bio, with its summary plus any bio stages the player has unlocked. Pure so
 * the reveal gating can be unit-tested without the React layer.
 */
export const buildNpcDossierEntries = (
  socialCatalog: SocialCatalogSnapshot | undefined,
  flags: Record<string, boolean>,
  trustByNpcId: IdPresenceLookup,
  favorByNpcId: IdPresenceLookup,
): NpcDossierEntry[] => {
  const entries: NpcDossierEntry[] = [];

  for (const identity of socialCatalog?.npcIdentities ?? []) {
    if (!identity.bio) {
      continue;
    }
    if (!isNpcIdentityRevealed(identity, flags, trustByNpcId, favorByNpcId)) {
      continue;
    }

    const stages = identity.bio.stages ?? [];
    const revealedStages: NpcDossierStage[] = [];
    let lockedStageCount = 0;

    for (const stage of stages) {
      if (!stage.revealFlag || flags[stage.revealFlag] === true) {
        revealedStages.push({ heading: stage.heading, text: stage.text });
      } else {
        lockedStageCount += 1;
      }
    }

    entries.push({
      id: identity.id,
      displayName: identity.displayName,
      publicRole: identity.publicRole,
      portraitUrl: identity.portraitUrl,
      summary: identity.bio.summary,
      revealedStages,
      lockedStageCount,
    });
  }

  return entries.sort((left, right) =>
    left.displayName.localeCompare(right.displayName),
  );
};

export const getRevealedFactionState = ({
  factionSignals,
  favorByNpcId,
  flags,
  socialCatalog,
  trustByNpcId,
}: {
  factionSignals?: Array<{
    factionId: string;
    value: number;
  }>;
  favorByNpcId: IdPresenceLookup;
  flags: Record<string, boolean>;
  socialCatalog?: SocialCatalogSnapshot;
  trustByNpcId: IdPresenceLookup;
}): RevealedFactionState => {
  const reasons = new Map<string, FactionRevealReason>();

  for (const identity of socialCatalog?.npcIdentities ?? []) {
    const definition = getFactionDefinition(identity.factionId, socialCatalog);
    if (
      !definition ||
      definition.visibility !== "public" ||
      identity.rosterTier === "archetype" ||
      !isNpcIdentityRevealed(identity, flags, trustByNpcId, favorByNpcId)
    ) {
      continue;
    }

    reasons.set(definition.id, "contact");
  }

  for (const entry of factionSignals ?? []) {
    if (!isCanonicalFactionId(entry.factionId)) {
      continue;
    }

    const definition = getFactionDefinition(entry.factionId, socialCatalog);
    if (
      !definition ||
      definition.visibility !== "public" ||
      Math.abs(entry.value) < MIN_FACTION_PRESSURE_REVEAL ||
      reasons.has(entry.factionId)
    ) {
      continue;
    }

    reasons.set(entry.factionId, "pressure");
  }

  const revealReasons = Object.fromEntries(reasons) as Partial<
    Record<string, FactionRevealReason>
  >;
  const revealedFactionIds = getPublicFactionCatalog(socialCatalog)
    .filter((entry) => reasons.has(entry.id))
    .map((entry) => entry.id);

  return {
    revealedFactionIds,
    revealReasons,
  };
};

export const getFactionSignalPresentation = (
  factionId: string,
  value: number,
  trend?: FactionSignalTrend | string,
  factionCatalogSource?: FactionCatalogSource,
): FactionSignalPresentation => {
  const meta = getFactionDefinition(factionId, factionCatalogSource);
  const magnitude = Math.abs(value);
  const stateIndex = magnitude >= 40 ? 2 : magnitude >= 15 ? 1 : 0;
  const stateLabels =
    value < 0
      ? NEGATIVE_SIGNAL_STATE_LABELS
      : (meta?.signalStateLabels ?? DEFAULT_SIGNAL_STATE_LABELS);

  return {
    factionId,
    label: meta?.label ?? formatIdentifier(factionId),
    stateLabel: stateLabels[stateIndex],
    trendLabel: getTrendLabel(trend),
    color: meta?.color ?? "#8a97a8",
    intensityPercent: clamp(Math.round((magnitude / 100) * 100), 12, 100),
  };
};

export const getCareerRanks = (
  socialCatalog: SocialCatalogSnapshot | undefined,
): CareerRankDefinition[] =>
  [...(socialCatalog?.careerRanks ?? FALLBACK_RANKS)].sort(
    (left, right) => left.order - right.order,
  );

export const getCareerRankDefinition = (
  socialCatalog: SocialCatalogSnapshot | undefined,
  rankId: string | null | undefined,
): CareerRankDefinition | undefined =>
  getCareerRanks(socialCatalog).find((entry) => entry.id === rankId);

export const getCareerRankLabel = (
  socialCatalog: SocialCatalogSnapshot | undefined,
  rankId: string | null | undefined,
): string =>
  getCareerRankDefinition(socialCatalog, rankId)?.label ?? "Ð¡Ñ‚Ð°Ð¶Ñ‘Ñ€";

export const getCareerRankOrder = (
  socialCatalog: SocialCatalogSnapshot | undefined,
  rankId: string | null | undefined,
): number => getCareerRankDefinition(socialCatalog, rankId)?.order ?? -1;

export const getFactionCatalogForUi = (socialCatalog?: SocialCatalogSnapshot) =>
  getFactionCatalog(socialCatalog);
