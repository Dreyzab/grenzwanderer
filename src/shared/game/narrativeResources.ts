export const RESOURCE_PROVIDENCE_VAR = "resource_providence";
export const RESOURCE_FORTUNE_VAR = "resource_fortune";
export const RESOURCE_FORTUNE_MOD_VAR = "resource_fortune_mod";
export const RESOURCE_KARMA_VAR = "resource_karma";

export const NARRATIVE_RESOURCE_DEFAULTS = {
  [RESOURCE_PROVIDENCE_VAR]: 2,
  [RESOURCE_FORTUNE_VAR]: 1,
  [RESOURCE_FORTUNE_MOD_VAR]: 0,
  [RESOURCE_KARMA_VAR]: 0,
} as const;

export const NARRATIVE_RESOURCE_CLAMPS = {
  [RESOURCE_PROVIDENCE_VAR]: { min: 0, max: 7 },
  [RESOURCE_FORTUNE_VAR]: { min: 0, max: 3 },
  [RESOURCE_FORTUNE_MOD_VAR]: { min: -3, max: 3 },
  [RESOURCE_KARMA_VAR]: { min: -100, max: 100 },
} as const;

export type NarrativeResourceKey = keyof typeof NARRATIVE_RESOURCE_DEFAULTS;

export const VN_AI_MODES = [
  "service",
  "narrative",
  "interrogation",
  "detective",
] as const;
export type VnAiMode = (typeof VN_AI_MODES)[number];

export const DIALOGUE_LAYERS = ["base", "providence"] as const;
export type DialogueLayer = (typeof DIALOGUE_LAYERS)[number];

export const KARMA_BANDS = [
  "damned",
  "stained",
  "neutral",
  "favored",
  "anointed",
] as const;
export type KarmaBand = (typeof KARMA_BANDS)[number];

export interface DifficultyBreakdownEntry {
  source: string;
  sourceId: string;
  delta: number;
}

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const isNarrativeResourceKey = (
  value: string,
): value is NarrativeResourceKey =>
  Object.prototype.hasOwnProperty.call(NARRATIVE_RESOURCE_DEFAULTS, value);

export const normalizeNarrativeResourceValue = (
  key: NarrativeResourceKey,
  value: number,
): number => {
  const clamp = NARRATIVE_RESOURCE_CLAMPS[key];
  return clampNumber(Math.trunc(value), clamp.min, clamp.max);
};

export const resolveKarmaBand = (value: number): KarmaBand => {
  const clamped = normalizeNarrativeResourceValue(RESOURCE_KARMA_VAR, value);
  if (clamped <= -60) {
    return "damned";
  }
  if (clamped <= -20) {
    return "stained";
  }
  if (clamped < 20) {
    return "neutral";
  }
  if (clamped < 60) {
    return "favored";
  }
  return "anointed";
};

export const resolveKarmaDifficultyDelta = (value: number): number => {
  const band = resolveKarmaBand(value);
  switch (band) {
    case "damned":
      return 2;
    case "stained":
      return 1;
    case "neutral":
      return 0;
    case "favored":
      return -1;
    case "anointed":
      return -2;
  }
};

export const resolveEffectiveFortune = (
  fortune: number,
  fortuneMod: number,
): number => Math.trunc(fortune) + Math.trunc(fortuneMod);

export const resolveDefaultProvidenceCost = (
  aiMode: VnAiMode | undefined,
  explicitCost: number | undefined,
): number => {
  if (typeof explicitCost === "number" && Number.isFinite(explicitCost)) {
    return Math.max(0, Math.trunc(explicitCost));
  }

  return aiMode === "service" ? 0 : 1;
};

export const isVnAiMode = (value: unknown): value is VnAiMode =>
  typeof value === "string" &&
  (VN_AI_MODES as readonly string[]).includes(value);

export const isDialogueLayer = (value: unknown): value is DialogueLayer =>
  typeof value === "string" &&
  (DIALOGUE_LAYERS as readonly string[]).includes(value);

export const isKarmaBand = (value: unknown): value is KarmaBand =>
  typeof value === "string" &&
  (KARMA_BANDS as readonly string[]).includes(value);
