import {
  SKILL_VOICE_IDS,
  type SkillVoiceId,
} from "../../../data/innerVoiceContract";
import {
  resolveSkillRank,
  resolveSkillXpFromVars,
  skillRankIndex,
  type SkillRank,
} from "./skillProgression";

export const CORE_CHARACTERISTIC_IDS = [
  "mind",
  "psyche",
  "body",
  "spirit",
  "shadow",
  "social",
] as const;

export type CoreCharacteristicId = (typeof CORE_CHARACTERISTIC_IDS)[number];

export const CHOICE_SOURCE_IDS = [
  "common",
  "voice",
  "origin",
  "synergy",
  "signature",
  "flaw",
  "volition",
] as const;

export type VnChoiceSource = (typeof CHOICE_SOURCE_IDS)[number];

export const CHARACTER_INDICATOR_IDS = ["talker"] as const;

export type CharacterIndicatorId = (typeof CHARACTER_INDICATOR_IDS)[number];

export const CHARACTER_SYNERGY_IDS = [
  "mind_empathy_soft_contradiction",
  "mind_shadow_clean_leverage",
  "mind_spirit_rational_demonology",
  "social_shadow_polite_lie",
  "psyche_body_stand_firm",
] as const;

export type CharacterSynergyId = (typeof CHARACTER_SYNERGY_IDS)[number];

export interface CoreCharacteristicDefinition {
  id: CoreCharacteristicId;
  label: string;
  labelRu: string;
  description: string;
  accent: string;
}

export interface CoreCharacteristicState extends CoreCharacteristicDefinition {
  base: number;
  potential: number;
  xp: number;
  value: number;
  modifier: number;
  progress: number;
  progressMax: number;
  isAtPotential: boolean;
  linkedSkillIds: readonly SkillVoiceId[];
}

export interface OriginCoreDefinition {
  base: number;
  potential: number;
  role?: "primary" | "secondary";
}

export interface OriginCoreProfile {
  id: string;
  flagKey: string;
  label: string;
  coreDefaults: Partial<Record<CoreCharacteristicId, OriginCoreDefinition>>;
}

export interface CharacterSynergyDefinition {
  id: CharacterSynergyId;
  label: string;
  labelRu: string;
  firstSkillIds: readonly SkillVoiceId[];
  secondSkillIds: readonly SkillVoiceId[];
}

export interface CharacterSynergyState extends CharacterSynergyDefinition {
  firstRank: SkillRank;
  secondRank: SkillRank;
  firstRankIndex: number;
  secondRankIndex: number;
  unlocked: boolean;
  modifier: number;
}

export interface SkillCheckBonusBreakdownEntry {
  source: string;
  sourceId: string;
  delta: number;
}

export interface EffectiveSkillCheckBonusContext {
  originId?: string | null;
  synergyId?: CharacterSynergyId;
  choiceSource?: VnChoiceSource;
  choiceType?: "action" | "inquiry" | "flavor";
}

export interface EffectiveSkillCheckBonus {
  skillId: SkillVoiceId;
  rank: SkillRank;
  rankBonus: number;
  coreId: CoreCharacteristicId;
  coreValue: number;
  coreModifier: number;
  total: number;
  breakdown: SkillCheckBonusBreakdownEntry[];
}

export const CORE_CHARACTERISTIC_DEFINITIONS = {
  mind: {
    id: "mind",
    label: "Mind",
    labelRu: "Разум",
    description: "Analysis, memory, evidence chains, and structured thought.",
    accent: "#60a5fa",
  },
  psyche: {
    id: "psyche",
    label: "Psyche",
    labelRu: "Психика",
    description: "Will, composure, intuition, and pressure resistance.",
    accent: "#c084fc",
  },
  body: {
    id: "body",
    label: "Body",
    labelRu: "Тело",
    description: "Endurance, physical action, pain tolerance, and agility.",
    accent: "#f87171",
  },
  spirit: {
    id: "spirit",
    label: "Spirit",
    labelRu: "Дух",
    description: "Occult sense, faith, ritual logic, and veil sensitivity.",
    accent: "#34d399",
  },
  shadow: {
    id: "shadow",
    label: "Shadow",
    labelRu: "Тень",
    description: "Deception, intrusion, stealth, and covert leverage.",
    accent: "#94a3b8",
  },
  social: {
    id: "social",
    label: "Social",
    labelRu: "Социум",
    description: "Charm, empathy, authority, and control of a conversation.",
    accent: "#fbbf24",
  },
} as const satisfies Record<CoreCharacteristicId, CoreCharacteristicDefinition>;

export const SKILL_CORE_BY_ID = {
  attr_logic: "mind",
  attr_intellect: "mind",
  attr_encyclopedia: "mind",
  attr_forensics: "mind",
  attr_perception: "mind",
  attr_psyche: "psyche",
  attr_composure: "psyche",
  attr_intuition: "psyche",
  attr_physical: "body",
  attr_endurance: "body",
  attr_agility: "body",
  attr_spirit: "spirit",
  attr_occultism: "spirit",
  attr_tradition: "spirit",
  attr_imagination: "spirit",
  attr_shadow: "shadow",
  attr_deception: "shadow",
  attr_stealth: "shadow",
  attr_intrusion: "shadow",
  attr_social: "social",
  attr_charisma: "social",
  attr_authority: "social",
  attr_empathy: "social",
  attr_poetics: "social",
} as const satisfies Record<SkillVoiceId, CoreCharacteristicId>;

export const SKILL_IDS_BY_CORE = CORE_CHARACTERISTIC_IDS.reduce(
  (registry, coreId) => {
    registry[coreId] = SKILL_VOICE_IDS.filter(
      (skillId) => SKILL_CORE_BY_ID[skillId] === coreId,
    );
    return registry;
  },
  {} as Record<CoreCharacteristicId, SkillVoiceId[]>,
);

const DEFAULT_CORE: OriginCoreDefinition = {
  base: 3,
  potential: 7,
};

export const ORIGIN_CORE_PROFILES = {
  detective: {
    id: "detective",
    flagKey: "origin_detective",
    label: "Detective",
    coreDefaults: {
      mind: { base: 6, potential: 10, role: "primary" },
      shadow: { base: 4, potential: 8, role: "secondary" },
      psyche: { base: 4, potential: 8, role: "secondary" },
      body: { base: 3, potential: 6 },
      spirit: { base: 2, potential: 6 },
      social: { base: 3, potential: 7 },
    },
  },
  journalist: {
    id: "journalist",
    flagKey: "origin_journalist",
    label: "Journalist",
    coreDefaults: {
      social: { base: 5, potential: 9, role: "primary" },
      shadow: { base: 5, potential: 8, role: "primary" },
      mind: { base: 4, potential: 8, role: "secondary" },
      psyche: { base: 3, potential: 7 },
      body: { base: 3, potential: 6 },
      spirit: { base: 2, potential: 6 },
    },
  },
  aristocrat: {
    id: "aristocrat",
    flagKey: "origin_aristocrat",
    label: "Aristocrat",
    coreDefaults: {
      social: { base: 5, potential: 9, role: "primary" },
      shadow: { base: 4, potential: 8, role: "secondary" },
      body: { base: 4, potential: 8, role: "secondary" },
      mind: { base: 3, potential: 7 },
      psyche: { base: 3, potential: 7 },
      spirit: { base: 2, potential: 6 },
    },
  },
  veteran: {
    id: "veteran",
    flagKey: "origin_veteran",
    label: "Veteran",
    coreDefaults: {
      body: { base: 6, potential: 10, role: "primary" },
      psyche: { base: 5, potential: 9, role: "secondary" },
      mind: { base: 3, potential: 7 },
      shadow: { base: 3, potential: 7 },
      spirit: { base: 3, potential: 7 },
      social: { base: 3, potential: 7 },
    },
  },
  archivist: {
    id: "archivist",
    flagKey: "origin_archivist",
    label: "Archivist",
    coreDefaults: {
      mind: { base: 5, potential: 10, role: "primary" },
      spirit: { base: 4, potential: 8, role: "secondary" },
      social: { base: 3, potential: 7, role: "secondary" },
      psyche: { base: 4, potential: 8 },
      body: { base: 2, potential: 6 },
      shadow: { base: 2, potential: 6 },
    },
  },
  witch: {
    id: "witch",
    flagKey: "origin_witch",
    label: "Witch",
    coreDefaults: {
      spirit: { base: 7, potential: 10, role: "primary" },
      psyche: { base: 5, potential: 9, role: "secondary" },
      mind: { base: 3, potential: 7, role: "secondary" },
      body: { base: 3, potential: 6 },
      shadow: { base: 3, potential: 7 },
      social: { base: 3, potential: 7 },
    },
  },
} as const satisfies Record<string, OriginCoreProfile>;

export type OriginCoreProfileId = keyof typeof ORIGIN_CORE_PROFILES;

export const CHARACTER_SYNERGIES = {
  mind_empathy_soft_contradiction: {
    id: "mind_empathy_soft_contradiction",
    label: "Mind + Empathy",
    labelRu: "Разум + Эмпатия",
    firstSkillIds: ["attr_logic", "attr_intellect"],
    secondSkillIds: ["attr_empathy"],
  },
  mind_shadow_clean_leverage: {
    id: "mind_shadow_clean_leverage",
    label: "Mind + Shadow",
    labelRu: "Разум + Тень",
    firstSkillIds: ["attr_logic", "attr_intellect"],
    secondSkillIds: ["attr_deception", "attr_shadow"],
  },
  mind_spirit_rational_demonology: {
    id: "mind_spirit_rational_demonology",
    label: "Mind + Spirit",
    labelRu: "Разум + Дух",
    firstSkillIds: ["attr_logic", "attr_intellect"],
    secondSkillIds: ["attr_occultism", "attr_spirit"],
  },
  social_shadow_polite_lie: {
    id: "social_shadow_polite_lie",
    label: "Social + Shadow",
    labelRu: "Социум + Тень",
    firstSkillIds: ["attr_social", "attr_charisma"],
    secondSkillIds: ["attr_deception"],
  },
  psyche_body_stand_firm: {
    id: "psyche_body_stand_firm",
    label: "Psyche + Body",
    labelRu: "Психика + Тело",
    firstSkillIds: ["attr_composure", "attr_psyche"],
    secondSkillIds: ["attr_endurance", "attr_physical"],
  },
} as const satisfies Record<CharacterSynergyId, CharacterSynergyDefinition>;

const CORE_ID_SET = new Set<string>(CORE_CHARACTERISTIC_IDS);
const CHOICE_SOURCE_SET = new Set<string>(CHOICE_SOURCE_IDS);
const INDICATOR_ID_SET = new Set<string>(CHARACTER_INDICATOR_IDS);
const SYNERGY_ID_SET = new Set<string>(CHARACTER_SYNERGY_IDS);

const clampInt = (value: number, min: number, max: number): number =>
  Math.min(
    max,
    Math.max(min, Number.isFinite(value) ? Math.trunc(value) : min),
  );

export const isCoreCharacteristicId = (
  value: unknown,
): value is CoreCharacteristicId =>
  typeof value === "string" && CORE_ID_SET.has(value);

export const isVnChoiceSource = (value: unknown): value is VnChoiceSource =>
  typeof value === "string" && CHOICE_SOURCE_SET.has(value);

export const isCharacterIndicatorId = (
  value: unknown,
): value is CharacterIndicatorId =>
  typeof value === "string" && INDICATOR_ID_SET.has(value);

export const isCharacterSynergyId = (
  value: unknown,
): value is CharacterSynergyId =>
  typeof value === "string" && SYNERGY_ID_SET.has(value);

export const coreBaseVarKeyFor = (
  coreId: CoreCharacteristicId,
): `core_${CoreCharacteristicId}_base` => `core_${coreId}_base`;

export const coreXpVarKeyFor = (
  coreId: CoreCharacteristicId,
): `core_${CoreCharacteristicId}_xp` => `core_${coreId}_xp`;

export const corePotentialVarKeyFor = (
  coreId: CoreCharacteristicId,
): `core_${CoreCharacteristicId}_potential` => `core_${coreId}_potential`;

export const CORE_CHARACTERISTIC_VAR_KEYS = CORE_CHARACTERISTIC_IDS.flatMap(
  (coreId) => [
    coreBaseVarKeyFor(coreId),
    coreXpVarKeyFor(coreId),
    corePotentialVarKeyFor(coreId),
  ],
);

export const indicatorRankVarKeyFor = (
  indicatorId: CharacterIndicatorId,
): `indicator_${CharacterIndicatorId}_rank` => `indicator_${indicatorId}_rank`;

export const INDICATOR_VAR_KEYS = CHARACTER_INDICATOR_IDS.map(
  indicatorRankVarKeyFor,
);

export const parseCoreCharacteristicVarKey = (
  key: string,
): {
  coreId: CoreCharacteristicId;
  kind: "base" | "xp" | "potential";
} | null => {
  const match =
    /^core_(mind|psyche|body|spirit|shadow|social)_(base|xp|potential)$/.exec(
      key,
    );
  if (!match || !isCoreCharacteristicId(match[1])) {
    return null;
  }
  return {
    coreId: match[1],
    kind: match[2] as "base" | "xp" | "potential",
  };
};

export const isIndicatorRankVarKey = (key: string): boolean =>
  /^indicator_(talker)_rank$/.test(key);

export const normalizeCharacterProgressionVarValue = (
  key: string,
  value: number,
): number | null => {
  const coreKey = parseCoreCharacteristicVarKey(key);
  if (coreKey) {
    return coreKey.kind === "xp"
      ? Math.max(0, Math.trunc(Number.isFinite(value) ? value : 0))
      : clampInt(value, 1, 10);
  }

  if (isIndicatorRankVarKey(key)) {
    return clampInt(value, 0, 5);
  }

  if (key === "stress_index") {
    return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  }

  if (key === "curse_pressure") {
    return Math.max(0, Number.isFinite(value) ? value : 0);
  }

  return null;
};

const getOriginProfile = (
  originId: string | null | undefined,
): OriginCoreProfile | null =>
  originId &&
  Object.prototype.hasOwnProperty.call(ORIGIN_CORE_PROFILES, originId)
    ? ORIGIN_CORE_PROFILES[originId as OriginCoreProfileId]
    : null;

export const resolveOriginIdFromFlags = (
  flags: Readonly<Record<string, boolean>>,
): OriginCoreProfileId | null => {
  for (const profile of Object.values(ORIGIN_CORE_PROFILES)) {
    if (flags[profile.flagKey]) {
      return profile.id as OriginCoreProfileId;
    }
  }
  return null;
};

export const resolveOriginCoreDefinition = (
  originId: string | null | undefined,
  coreId: CoreCharacteristicId,
): OriginCoreDefinition => {
  const profile = getOriginProfile(originId);
  return profile?.coreDefaults[coreId] ?? DEFAULT_CORE;
};

export const resolveCoreXpThreshold = (
  originId: string | null | undefined,
  coreId: CoreCharacteristicId,
): number => {
  const role = resolveOriginCoreDefinition(originId, coreId).role;
  if (role === "primary") {
    return 100;
  }
  if (role === "secondary") {
    return 150;
  }
  return 200;
};

export const coreModifierForValue = (value: number): number => {
  if (value <= 2) {
    return -1;
  }
  if (value <= 5) {
    return 0;
  }
  if (value <= 8) {
    return 1;
  }
  return 2;
};

export const resolveCoreCharacteristicState = (
  vars: Readonly<Record<string, number>>,
  coreId: CoreCharacteristicId,
  originId?: string | null,
): CoreCharacteristicState => {
  const fallback = resolveOriginCoreDefinition(originId, coreId);
  const base = clampInt(
    vars[coreBaseVarKeyFor(coreId)] ?? fallback.base,
    1,
    10,
  );
  const potential = clampInt(
    vars[corePotentialVarKeyFor(coreId)] ?? fallback.potential,
    1,
    10,
  );
  const xp = Math.max(0, Math.trunc(vars[coreXpVarKeyFor(coreId)] ?? 0));
  const progressMax = resolveCoreXpThreshold(originId, coreId);
  const earnedPoints = Math.floor(xp / progressMax);
  const value = Math.min(potential, Math.max(1, base + earnedPoints));
  const isAtPotential = value >= potential;

  return {
    ...CORE_CHARACTERISTIC_DEFINITIONS[coreId],
    base,
    potential,
    xp,
    value,
    modifier: coreModifierForValue(value),
    progress: isAtPotential ? 0 : xp % progressMax,
    progressMax,
    isAtPotential,
    linkedSkillIds: SKILL_IDS_BY_CORE[coreId],
  };
};

export const resolveAllCoreCharacteristicStates = (
  vars: Readonly<Record<string, number>>,
  originId?: string | null,
): CoreCharacteristicState[] =>
  CORE_CHARACTERISTIC_IDS.map((coreId) =>
    resolveCoreCharacteristicState(vars, coreId, originId),
  );

export const resolveIndicatorRank = (
  vars: Readonly<Record<string, number>>,
  indicatorId: CharacterIndicatorId,
): number => clampInt(vars[indicatorRankVarKeyFor(indicatorId)] ?? 0, 0, 5);

const highestSkillRank = (
  vars: Readonly<Record<string, number>>,
  skillIds: readonly SkillVoiceId[],
): { rank: SkillRank; rankIndex: number } => {
  let bestRank = resolveSkillRank(0).rank;
  let bestRankIndex = 0;
  for (const skillId of skillIds) {
    const rank = resolveSkillRank(resolveSkillXpFromVars(vars, skillId)).rank;
    const index = skillRankIndex(rank);
    if (index > bestRankIndex) {
      bestRank = rank;
      bestRankIndex = index;
    }
  }
  return { rank: bestRank, rankIndex: bestRankIndex };
};

export const resolveCharacterSynergyState = (
  vars: Readonly<Record<string, number>>,
  synergyId: CharacterSynergyId,
): CharacterSynergyState => {
  const definition = CHARACTER_SYNERGIES[synergyId];
  const first = highestSkillRank(vars, definition.firstSkillIds);
  const second = highestSkillRank(vars, definition.secondSkillIds);
  const lowestRankIndex = Math.min(first.rankIndex, second.rankIndex);
  const modifier = lowestRankIndex >= 5 ? 2 : lowestRankIndex >= 4 ? 1 : 0;

  return {
    ...definition,
    firstRank: first.rank,
    secondRank: second.rank,
    firstRankIndex: first.rankIndex,
    secondRankIndex: second.rankIndex,
    unlocked: lowestRankIndex >= 3,
    modifier,
  };
};

export const resolveAllCharacterSynergyStates = (
  vars: Readonly<Record<string, number>>,
): CharacterSynergyState[] =>
  CHARACTER_SYNERGY_IDS.map((synergyId) =>
    resolveCharacterSynergyState(vars, synergyId),
  );

const resolveOriginSkillBonus = (
  originId: string | null | undefined,
  skillId: SkillVoiceId,
): number => {
  const coreId = SKILL_CORE_BY_ID[skillId];
  return resolveOriginCoreDefinition(originId, coreId).role === "primary"
    ? 1
    : 0;
};

const resolveStressDelta = (vars: Readonly<Record<string, number>>): number => {
  const stressIndex = vars.stress_index ?? 0;
  if (stressIndex >= 0.7) {
    return -2;
  }
  if (stressIndex >= 0.4) {
    return -1;
  }
  return 0;
};

const resolveCurseDelta = (
  vars: Readonly<Record<string, number>>,
  skillId: SkillVoiceId,
): number => {
  const cursePressure = vars.curse_pressure ?? 0;
  if (cursePressure <= 0) {
    return 0;
  }
  const coreId = SKILL_CORE_BY_ID[skillId];
  return coreId === "psyche" || coreId === "social" ? -1 : 0;
};

export const resolveEffectiveSkillCheckBonus = (
  vars: Readonly<Record<string, number>>,
  skillId: SkillVoiceId,
  context: EffectiveSkillCheckBonusContext = {},
): EffectiveSkillCheckBonus => {
  const rank = resolveSkillRank(resolveSkillXpFromVars(vars, skillId)).rank;
  const rankBonus = skillRankIndex(rank);
  const coreId = SKILL_CORE_BY_ID[skillId];
  const coreState = resolveCoreCharacteristicState(
    vars,
    coreId,
    context.originId,
  );
  const originBonus = resolveOriginSkillBonus(context.originId, skillId);
  const talkerBonus =
    context.choiceType === "inquiry" &&
    SKILL_CORE_BY_ID[skillId] === "social" &&
    resolveIndicatorRank(vars, "talker") >= 4
      ? 1
      : 0;
  const synergyState = context.synergyId
    ? resolveCharacterSynergyState(vars, context.synergyId)
    : null;
  const synergyBonus = synergyState?.modifier ?? 0;
  const stressDelta = resolveStressDelta(vars);
  const curseDelta = resolveCurseDelta(vars, skillId);

  const breakdown: SkillCheckBonusBreakdownEntry[] = [
    { source: "voice", sourceId: skillId, delta: rankBonus },
  ];
  if (coreState.modifier !== 0) {
    breakdown.push({
      source: "core",
      sourceId: coreId,
      delta: coreState.modifier,
    });
  }
  if (originBonus !== 0 && context.originId) {
    breakdown.push({
      source: "origin",
      sourceId: context.originId,
      delta: originBonus,
    });
  }
  if (talkerBonus !== 0) {
    breakdown.push({
      source: "indicator",
      sourceId: "talker",
      delta: talkerBonus,
    });
  }
  if (synergyBonus !== 0 && context.synergyId) {
    breakdown.push({
      source: "voice_synergy",
      sourceId: context.synergyId,
      delta: synergyBonus,
    });
  }
  if (stressDelta !== 0) {
    breakdown.push({
      source: "stress",
      sourceId: "stress_index",
      delta: stressDelta,
    });
  }
  if (curseDelta !== 0) {
    breakdown.push({
      source: "curse",
      sourceId: "curse_pressure",
      delta: curseDelta,
    });
  }

  return {
    skillId,
    rank,
    rankBonus,
    coreId,
    coreValue: coreState.value,
    coreModifier: coreState.modifier,
    total: breakdown.reduce((sum, entry) => sum + entry.delta, 0),
    breakdown,
  };
};

export const resolveSkillXpMultiplier = (
  vars: Readonly<Record<string, number>>,
  skillId: SkillVoiceId,
  originId?: string | null,
): number => {
  const coreId = SKILL_CORE_BY_ID[skillId];
  const coreState = resolveCoreCharacteristicState(vars, coreId, originId);
  const coreBonus = coreState.value >= 9 ? 0.2 : coreState.value >= 6 ? 0.1 : 0;
  const originBonus =
    resolveOriginCoreDefinition(originId, coreId).role === "primary" ? 0.25 : 0;
  return Math.min(1.5, 1 + coreBonus + originBonus);
};

export const resolveSkillXpAwardWithMultiplier = (
  vars: Readonly<Record<string, number>>,
  skillId: SkillVoiceId,
  baseAmount: number,
  originId?: string | null,
): number =>
  Math.max(
    1,
    Math.round(baseAmount * resolveSkillXpMultiplier(vars, skillId, originId)),
  );

export const buildOriginCoreVarEntries = (
  originId: string,
): Array<{ key: string; value: number }> => {
  const profile = getOriginProfile(originId);
  if (!profile) {
    return [];
  }

  return CORE_CHARACTERISTIC_IDS.flatMap((coreId) => {
    const definition = resolveOriginCoreDefinition(originId, coreId);
    return [
      { key: coreBaseVarKeyFor(coreId), value: definition.base },
      { key: corePotentialVarKeyFor(coreId), value: definition.potential },
      { key: coreXpVarKeyFor(coreId), value: 0 },
    ];
  });
};
