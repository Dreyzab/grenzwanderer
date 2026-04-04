import type {
  MysticAwakeningBand,
  MysticEntityArchetype,
  MysticObservationDefinition,
  MysticObservationKind,
  SightMode,
  VnSnapshot,
} from "../../vn/types";
import { buildSpiritRoster as buildSpiritRosterFn } from "./spiritState";

export const MYSTIC_AWAKENING_VAR = "mystic_awakening";
export const MYSTIC_EXPOSURE_VAR = "mystic_exposure";
export const MYSTIC_RATIONALIST_BUFFER_VAR = "mystic_rationalist_buffer";
export const MYSTIC_SIGHT_MODE_VAR = "mystic_sight_mode_tier";

const SIGHT_MODE_TIER: Record<SightMode, number> = {
  rational: 0,
  sensitive: 1,
  ether: 2,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export interface MysticStateSummary {
  awakeningLevel: number;
  awakeningBand: MysticAwakeningBand;
  awakeningBandLabel: string;
  awakeningBandDescription: string;
  mysticExposure: number;
  rationalistBuffer: number;
  rationalism: number;
  activeSightMode: SightMode;
}

export interface MysticEntityKnowledgeEntry {
  id: string;
  label: string;
  veilLevel: number;
  observationCount: number;
  signatureIds: string[];
}

export const mysticObservationFlagKey = (observationId: string): string =>
  `mystic_obs_${observationId}`;

export const mysticSignatureFlagKey = (signatureId: string): string =>
  `mystic_signature_${signatureId}`;

export const mysticEntityFlagKey = (entityArchetypeId: string): string =>
  `mystic_entity_${entityArchetypeId}`;

export const mysticDistortionPointFlagKey = (pointId: string): string =>
  `mystic_distortion_${pointId}`;

export const deriveAwakeningBand = (
  awakeningLevel: number,
): MysticAwakeningBand => {
  if (awakeningLevel >= 75) {
    return "pierced";
  }
  if (awakeningLevel >= 50) {
    return "open";
  }
  if (awakeningLevel >= 25) {
    return "fractured";
  }
  return "suppressed";
};

export const formatAwakeningBandLabel = (band: MysticAwakeningBand): string => {
  if (band === "suppressed") {
    return "Containment";
  }
  if (band === "fractured") {
    return "Fracture";
  }
  if (band === "open") {
    return "Opening";
  }
  return "Piercing";
};

export const describeAwakeningBand = (band: MysticAwakeningBand): string => {
  if (band === "suppressed") {
    return "The unseen still reads as noise, coincidence, or fatigue.";
  }
  if (band === "fractured") {
    return "Patterns leak through the rational surface, but remain unstable.";
  }
  if (band === "open") {
    return "Anomalies begin to resolve into recurring structures and intent.";
  }
  return "The veil has split. Direct contact becomes possible, but never safe.";
};

export const deriveSightMode = (vars: Record<string, number>): SightMode => {
  const tier = clamp(Math.round(vars[MYSTIC_SIGHT_MODE_VAR] ?? 0), 0, 2);
  if (tier >= SIGHT_MODE_TIER.ether) {
    return "ether";
  }
  if (tier >= SIGHT_MODE_TIER.sensitive) {
    return "sensitive";
  }
  return "rational";
};

export const formatSightModeLabel = (mode: SightMode): string => {
  if (mode === "rational") {
    return "Rational";
  }
  if (mode === "sensitive") {
    return "Sensitive";
  }
  return "Ether";
};

export const isSightModeAllowed = (
  visibilityModes: SightMode[] | undefined,
  currentSightMode: SightMode,
): boolean => {
  if (!visibilityModes || visibilityModes.length === 0) {
    return true;
  }

  const currentTier = SIGHT_MODE_TIER[currentSightMode];
  return visibilityModes.some((mode) => currentTier >= SIGHT_MODE_TIER[mode]);
};

export const buildMysticStateSummary = (
  vars: Record<string, number>,
): MysticStateSummary => {
  const awakeningLevel = clamp(vars[MYSTIC_AWAKENING_VAR] ?? 0, 0, 100);
  const mysticExposure = Math.max(
    0,
    Math.round(vars[MYSTIC_EXPOSURE_VAR] ?? 0),
  );
  const rationalistBuffer = Math.max(
    0,
    Math.round(vars[MYSTIC_RATIONALIST_BUFFER_VAR] ?? 0),
  );
  const awakeningBand = deriveAwakeningBand(awakeningLevel);

  return {
    awakeningLevel,
    awakeningBand,
    awakeningBandLabel: formatAwakeningBandLabel(awakeningBand),
    awakeningBandDescription: describeAwakeningBand(awakeningBand),
    mysticExposure,
    rationalistBuffer,
    rationalism: clamp(100 - awakeningLevel + rationalistBuffer, 0, 100),
    activeSightMode: deriveSightMode(vars),
  };
};

export const formatObservationKindLabel = (
  kind: MysticObservationKind,
): string => kind.replace(/\b\w/g, (entry) => entry.toUpperCase());

export const resolveUnlockedObservationEntries = (
  snapshot: VnSnapshot | null,
  flags: Record<string, boolean>,
): MysticObservationDefinition[] => {
  const entries = snapshot?.mysticism?.observations ?? [];

  return entries.filter(
    (entry) =>
      entry.unlockedByDefault ||
      Boolean(flags[mysticObservationFlagKey(entry.id)]),
  );
};

export const buildEntityKnowledge = (
  entityArchetypes: MysticEntityArchetype[] | undefined,
  observationEntries: MysticObservationDefinition[],
): MysticEntityKnowledgeEntry[] => {
  const archetypesById = new Map(
    (entityArchetypes ?? []).map((entry) => [entry.id, entry] as const),
  );

  const buckets = new Map<string, MysticEntityKnowledgeEntry>();
  for (const entry of observationEntries) {
    if (!entry.entityArchetypeId) {
      continue;
    }

    const archetype = archetypesById.get(entry.entityArchetypeId);
    const existing = buckets.get(entry.entityArchetypeId);
    const nextSignatures = new Set([
      ...(existing?.signatureIds ?? []),
      ...(entry.signatureIds ?? []),
    ]);

    buckets.set(entry.entityArchetypeId, {
      id: entry.entityArchetypeId,
      label: archetype?.label ?? entry.entityArchetypeId,
      veilLevel: archetype?.veilLevel ?? 0,
      observationCount: (existing?.observationCount ?? 0) + 1,
      signatureIds: [...nextSignatures].sort((left, right) =>
        left.localeCompare(right),
      ),
    });
  }

  return [...buckets.values()].sort((left, right) => {
    if (right.observationCount === left.observationCount) {
      return left.label.localeCompare(right.label);
    }
    return right.observationCount - left.observationCount;
  });
};

export {
  buildSpiritRoster,
  deriveSpiritStateFromFlags,
  deriveSpiritMethod,
  hasControlledSpiritOfArchetype,
  resolveControlledSpiritModifiers,
  resolveObservationSignatureBonus,
  type SpiritRosterEntry,
} from "./spiritState";

export interface MysticFullSummary extends MysticStateSummary {
  spiritRoster: import("./spiritState").SpiritRosterEntry[];
  entityKnowledge: MysticEntityKnowledgeEntry[];
  unlockedObservations: MysticObservationDefinition[];
}

export const buildMysticFullSummary = (
  snapshot: VnSnapshot | null,
  vars: Record<string, number>,
  flags: Record<string, boolean>,
): MysticFullSummary => {
  const base = buildMysticStateSummary(vars);
  const observations = resolveUnlockedObservationEntries(snapshot, flags);
  const spiritRoster = buildSpiritRosterFn(snapshot, flags);

  return {
    ...base,
    spiritRoster,
    entityKnowledge: buildEntityKnowledge(
      snapshot?.mysticism?.entityArchetypes,
      observations,
    ),
    unlockedObservations: observations,
  };
};
