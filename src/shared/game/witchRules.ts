export const WITCH_BLOOD_CURSE_TIER_VAR = "witch_blood_curse_tier";
export const WITCH_BLOOD_CURSE_PRESSURE_VAR = "witch_blood_curse_pressure";
export const WITCH_BLOOD_POWER_VAR = "witch_blood_power";
export const WITCH_BLOOD_DEBT_VAR = "witch_blood_debt";
export const WITCH_ALCOHOL_AFTERTASTE_VAR = "witch_alcohol_aftertaste";
export const RESOURCE_VOLITION_TOKEN_VAR = "resource_volition_token";

export const WITCH_STATE_VAR_KEYS = [
  WITCH_BLOOD_CURSE_TIER_VAR,
  WITCH_BLOOD_CURSE_PRESSURE_VAR,
  WITCH_BLOOD_POWER_VAR,
  WITCH_BLOOD_DEBT_VAR,
  WITCH_ALCOHOL_AFTERTASTE_VAR,
  RESOURCE_VOLITION_TOKEN_VAR,
] as const;

export type WitchStateVarKey = (typeof WITCH_STATE_VAR_KEYS)[number];

export const WITCH_BLOOD_CURSE_MAX_PRESSURE = 100;
export const WITCH_BLOOD_CURSE_MIN_TIER = 1;
export const WITCH_BLOOD_CURSE_MAX_TIER = 3;

export const WITCH_ORIGIN_DEFAULTS = {
  resource_fate_token: 6,
  // Discrete budget of will-acts the two Vetoes spend. Kept SEPARATE from
  // resource_fate_token (which funds DM intervention) so the Warm Veto greying
  // means "she spent her humanity", not "she bought a DM favour earlier".
  // See docs/WITCH_VOLITION_AND_VETO_SPEC.md. First-pass value; tunable.
  resource_volition_token: 3,
  resource_fortune: 0,
  resource_fortune_mod: -1,
  resource_karma: -10,
  [WITCH_BLOOD_CURSE_TIER_VAR]: 1,
  [WITCH_BLOOD_CURSE_PRESSURE_VAR]: 35,
  [WITCH_BLOOD_POWER_VAR]: 0,
  [WITCH_BLOOD_DEBT_VAR]: 0,
  [WITCH_ALCOHOL_AFTERTASTE_VAR]: 0,
} as const;

export interface WitchBloodCurseState {
  tier: number;
  pressure: number;
  bloodPower: number;
  bloodDebt: number;
  alcoholAftertaste: number;
}

export type WitchBloodCurseOverflow =
  | "none"
  | "bargain_or_complication"
  | "predator_impulse"
  | "hard_bargain_exposure_or_spirit_danger";

export type BloodQuality = "thin" | "ordinary" | "potent";

export interface WitchBloodAbsorptionInput {
  quality: BloodQuality;
  quantity: number;
}

export interface WitchRuleResult {
  state: WitchBloodCurseState;
  overflow: WitchBloodCurseOverflow;
}

const clampInt = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.trunc(value)));

export const normalizeWitchBloodCurseState = (
  state: WitchBloodCurseState,
): WitchBloodCurseState => ({
  tier: clampInt(
    state.tier,
    WITCH_BLOOD_CURSE_MIN_TIER,
    WITCH_BLOOD_CURSE_MAX_TIER,
  ),
  pressure: clampInt(state.pressure, 0, WITCH_BLOOD_CURSE_MAX_PRESSURE),
  bloodPower: Math.max(0, Math.trunc(state.bloodPower)),
  bloodDebt: Math.max(0, Math.trunc(state.bloodDebt)),
  alcoholAftertaste: Math.max(0, Math.trunc(state.alcoholAftertaste)),
});

export const overflowForBloodCurseTier = (
  tier: number,
): WitchBloodCurseOverflow => {
  if (tier <= 1) {
    return "bargain_or_complication";
  }
  if (tier === 2) {
    return "predator_impulse";
  }
  return "hard_bargain_exposure_or_spirit_danger";
};

export const applyWitchPressure = (
  state: WitchBloodCurseState,
  delta: number,
): WitchRuleResult => {
  const normalized = normalizeWitchBloodCurseState(state);
  const rawPressure = normalized.pressure + Math.trunc(delta);
  if (rawPressure <= WITCH_BLOOD_CURSE_MAX_PRESSURE) {
    return {
      state: normalizeWitchBloodCurseState({
        ...normalized,
        pressure: rawPressure,
      }),
      overflow: "none",
    };
  }

  return {
    state: normalizeWitchBloodCurseState({
      ...normalized,
      pressure: rawPressure - WITCH_BLOOD_CURSE_MAX_PRESSURE,
      tier: Math.min(normalized.tier + 1, WITCH_BLOOD_CURSE_MAX_TIER),
    }),
    overflow: overflowForBloodCurseTier(normalized.tier),
  };
};

export const applySpiritualVeilFocus = (
  state: WitchBloodCurseState,
  pressureCost = 15,
): WitchRuleResult => applyWitchPressure(state, pressureCost);

export const applyAlcoholRelief = (
  state: WitchBloodCurseState,
  relief = 12,
  aftertaste = 1,
): WitchRuleResult => {
  const normalized = normalizeWitchBloodCurseState(state);
  return {
    state: normalizeWitchBloodCurseState({
      ...normalized,
      pressure: normalized.pressure - Math.max(0, Math.trunc(relief)),
      alcoholAftertaste:
        normalized.alcoholAftertaste + Math.max(1, Math.trunc(aftertaste)),
    }),
    overflow: "none",
  };
};

export const applyRitualRelief = (
  state: WitchBloodCurseState,
  relief = 8,
): WitchRuleResult => {
  const normalized = normalizeWitchBloodCurseState(state);
  return {
    state: normalizeWitchBloodCurseState({
      ...normalized,
      pressure: normalized.pressure - Math.max(0, Math.trunc(relief)),
    }),
    overflow: "none",
  };
};

export const FACADE_DC_PRESSURE_DIVISOR = 20;

export const facadeDifficulty = (
  baseDifficulty: number,
  pressure: number,
  divisor = FACADE_DC_PRESSURE_DIVISOR,
): number => {
  const safeDivisor = Math.max(1, Math.trunc(divisor));
  const clampedPressure = clampInt(pressure, 0, WITCH_BLOOD_CURSE_MAX_PRESSURE);
  return Math.trunc(baseDifficulty) + Math.floor(clampedPressure / safeDivisor);
};

export const applyBloodAbsorption = (
  state: WitchBloodCurseState,
  input: WitchBloodAbsorptionInput,
): WitchRuleResult => {
  const normalized = normalizeWitchBloodCurseState(state);
  const quantity = Math.max(1, Math.trunc(input.quantity));
  const qualityMultiplier =
    input.quality === "potent" ? 3 : input.quality === "ordinary" ? 2 : 1;
  const relief = 10 * qualityMultiplier * quantity;
  const powerGain = qualityMultiplier * quantity;
  const debtGain = 8 * qualityMultiplier * quantity;

  return {
    state: normalizeWitchBloodCurseState({
      ...normalized,
      pressure: normalized.pressure - relief,
      bloodPower: normalized.bloodPower + powerGain,
      bloodDebt: normalized.bloodDebt + debtGain,
    }),
    overflow: "none",
  };
};
