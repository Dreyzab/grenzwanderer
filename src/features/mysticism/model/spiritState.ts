import type {
  SpiritControlledBonus,
  SpiritEncounterDefinition,
  SpiritState,
  SpiritSubjugationMethod,
  VnCheckModifier,
  VnSnapshot,
} from "../../vn/types";

export const SPIRIT_STATE_PREFIX = "spirit_state_";
export const SPIRIT_METHOD_PREFIX = "spirit_method_";

export const spiritStateFlagKey = (spiritId: string): string =>
  `${SPIRIT_STATE_PREFIX}${spiritId}`;

export const spiritMethodFlagKey = (spiritId: string): string =>
  `${SPIRIT_METHOD_PREFIX}${spiritId}`;

const SPIRIT_STATE_MAP: Record<string, SpiritState> = {
  hostile: "hostile",
  imprisoned: "imprisoned",
  controlled: "controlled",
  destroyed: "destroyed",
};

const isSpiritState = (value: unknown): value is SpiritState =>
  typeof value === "string" && value in SPIRIT_STATE_MAP;

export const deriveSpiritState = (
  spiritId: string,
  vars: Record<string, number>,
): SpiritState => {
  const raw = vars[spiritStateFlagKey(spiritId)];
  if (raw === undefined) {
    return "hostile";
  }
  const label = Object.keys(SPIRIT_STATE_MAP)[raw];
  return label && isSpiritState(label) ? label : "hostile";
};

export const SPIRIT_STATE_NUMERIC: Record<SpiritState, number> = {
  hostile: 0,
  imprisoned: 1,
  controlled: 2,
  destroyed: 3,
};

export const deriveSpiritStateFromFlags = (
  spiritId: string,
  flags: Record<string, boolean>,
): SpiritState => {
  if (flags[`${SPIRIT_STATE_PREFIX}${spiritId}::destroyed`]) {
    return "destroyed";
  }
  if (flags[`${SPIRIT_STATE_PREFIX}${spiritId}::controlled`]) {
    return "controlled";
  }
  if (flags[`${SPIRIT_STATE_PREFIX}${spiritId}::imprisoned`]) {
    return "imprisoned";
  }
  return "hostile";
};

export const deriveSpiritMethod = (
  spiritId: string,
  flags: Record<string, boolean>,
): SpiritSubjugationMethod | null => {
  const dialogue = flags[`${SPIRIT_METHOD_PREFIX}${spiritId}::dialogue`];
  if (dialogue) return "dialogue";

  const battle = flags[`${SPIRIT_METHOD_PREFIX}${spiritId}::battle`];
  if (battle) return "battle";

  const ritual = flags[`${SPIRIT_METHOD_PREFIX}${spiritId}::ritual`];
  if (ritual) return "ritual";

  return null;
};

export interface SpiritRosterEntry {
  id: string;
  entityArchetypeId: string;
  displayName: string;
  state: SpiritState;
  method: SpiritSubjugationMethod | null;
  controlledBonuses: SpiritControlledBonus[];
}

export const buildSpiritRoster = (
  snapshot: VnSnapshot | null,
  flags: Record<string, boolean>,
): SpiritRosterEntry[] => {
  const encounters = snapshot?.mysticism?.spiritEncounters ?? [];
  if (encounters.length === 0) {
    return [];
  }

  return encounters.map((encounter) => {
    const state = deriveSpiritStateFromFlags(encounter.id, flags);
    const method = deriveSpiritMethod(encounter.id, flags);
    return {
      id: encounter.id,
      entityArchetypeId: encounter.entityArchetypeId,
      displayName: encounter.displayName,
      state,
      method,
      controlledBonuses:
        state === "controlled" ? encounter.controlledBonuses : [],
    };
  });
};

export const resolveControlledSpiritModifiers = (
  snapshot: VnSnapshot | null,
  flags: Record<string, boolean>,
): VnCheckModifier[] => {
  const roster = buildSpiritRoster(snapshot, flags);
  const modifiers: VnCheckModifier[] = [];

  for (const entry of roster) {
    if (entry.state !== "controlled") {
      continue;
    }
    for (const bonus of entry.controlledBonuses) {
      if (bonus.type === "skill_modifier" && bonus.voiceId && bonus.delta) {
        modifiers.push({
          source: "trait",
          sourceId: `spirit::${entry.id}`,
          delta: bonus.delta,
        });
      }
    }
  }

  return modifiers;
};

export const hasControlledSpiritOfArchetype = (
  snapshot: VnSnapshot | null,
  flags: Record<string, boolean>,
  entityArchetypeId: string,
): boolean => {
  const roster = buildSpiritRoster(snapshot, flags);
  return roster.some(
    (entry) =>
      entry.state === "controlled" &&
      entry.entityArchetypeId === entityArchetypeId,
  );
};

export const resolveObservationSignatureBonus = (
  encounter: SpiritEncounterDefinition,
  flags: Record<string, boolean>,
): number => {
  const observations = encounter.observationBonusPerSignature;
  if (observations <= 0) {
    return 0;
  }

  let taggedCount = 0;
  const prefix = `mystic_signature_`;
  for (const key of Object.keys(flags)) {
    if (key.startsWith(prefix) && flags[key]) {
      taggedCount += 1;
    }
  }

  return taggedCount * observations;
};
