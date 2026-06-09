import { describe, expect, it } from "vitest";

import {
  applyAlcoholRelief,
  applyBloodAbsorption,
  applyRitualRelief,
  applySpiritualVeilFocus,
  facadeDifficulty,
  overflowForBloodCurseTier,
  WITCH_ORIGIN_DEFAULTS,
  type WitchBloodCurseState,
} from "./witchRules";

const baseState: WitchBloodCurseState = {
  tier: 1,
  pressure: 35,
  bloodPower: 0,
  bloodDebt: 0,
  alcoholAftertaste: 0,
};

describe("witch rules", () => {
  it("defines Eleonora's one-shot starting resources and curse state", () => {
    expect(WITCH_ORIGIN_DEFAULTS).toMatchObject({
      resource_fate_token: 6,
      resource_volition_token: 3,
      resource_fortune: 0,
      resource_fortune_mod: -1,
      resource_karma: -10,
      witch_blood_curse_tier: 1,
      witch_blood_curse_pressure: 35,
      witch_blood_power: 0,
      witch_blood_debt: 0,
      witch_alcohol_aftertaste: 0,
    });
  });

  it("raises blood pressure when Veil Sight is focused", () => {
    const result = applySpiritualVeilFocus(baseState);

    expect(result.state.pressure).toBe(50);
    expect(result.overflow).toBe("none");
  });

  it("turns tier-one overflow into a bargain or complication", () => {
    const result = applySpiritualVeilFocus({ ...baseState, pressure: 95 }, 15);

    expect(result.state.tier).toBe(2);
    expect(result.state.pressure).toBe(10);
    expect(result.overflow).toBe("bargain_or_complication");
  });

  it("maps higher curse overflows to stronger consequences", () => {
    expect(overflowForBloodCurseTier(1)).toBe("bargain_or_complication");
    expect(overflowForBloodCurseTier(2)).toBe("predator_impulse");
    expect(overflowForBloodCurseTier(3)).toBe(
      "hard_bargain_exposure_or_spirit_danger",
    );
  });

  it("lets alcohol reduce pressure now while leaving aftertaste", () => {
    const result = applyAlcoholRelief(baseState);

    expect(result.state.pressure).toBe(23);
    expect(result.state.alcoholAftertaste).toBe(1);
  });

  it("lets a safe-zone ritual lower pressure without debt or aftertaste", () => {
    const result = applyRitualRelief({ ...baseState, pressure: 50 });

    expect(result.state.pressure).toBe(42);
    expect(result.state.alcoholAftertaste).toBe(0);
    expect(result.state.bloodDebt).toBe(0);
    expect(result.overflow).toBe("none");
  });

  it("gives less relief than alcohol so the clean path stays slower", () => {
    const ritual = applyRitualRelief({ ...baseState, pressure: 50 });
    const alcohol = applyAlcoholRelief({ ...baseState, pressure: 50 });

    expect(50 - ritual.state.pressure).toBeLessThan(
      50 - alcohol.state.pressure,
    );
  });

  it("raises the Facade check difficulty as curse pressure climbs", () => {
    expect(facadeDifficulty(9, 35)).toBe(10);
    expect(facadeDifficulty(13, 80)).toBe(17);
    expect(facadeDifficulty(9, 0)).toBe(9);
  });

  it("clamps Facade difficulty pressure to the curse range", () => {
    expect(facadeDifficulty(9, 999)).toBe(facadeDifficulty(9, 100));
    expect(facadeDifficulty(9, -50)).toBe(9);
  });

  it("lets blood absorption grant power and debt while lowering pressure", () => {
    const result = applyBloodAbsorption(baseState, {
      quality: "potent",
      quantity: 2,
    });

    expect(result.state.pressure).toBe(0);
    expect(result.state.bloodPower).toBe(6);
    expect(result.state.bloodDebt).toBe(48);
  });
});
