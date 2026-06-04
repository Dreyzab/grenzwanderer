import { describe, expect, it } from "vitest";

import {
  coreBaseVarKeyFor,
  corePotentialVarKeyFor,
  coreXpVarKeyFor,
  indicatorRankVarKeyFor,
  resolveCharacterSynergyState,
  resolveCoreCharacteristicState,
  resolveEffectiveSkillCheckBonus,
  resolveSkillXpAwardWithMultiplier,
} from "./characterProgression";
import { skillXpVarKeyFor } from "./skillProgression";

describe("character progression", () => {
  it("resolves core XP into effective values and respects potential caps", () => {
    const vars = {
      [coreBaseVarKeyFor("mind")]: 6,
      [corePotentialVarKeyFor("mind")]: 10,
      [coreXpVarKeyFor("mind")]: 425,
    };

    const state = resolveCoreCharacteristicState(vars, "mind", "detective");

    expect(state.value).toBe(10);
    expect(state.modifier).toBe(2);
    expect(state.isAtPotential).toBe(true);
  });

  it("keeps Detective mind at 6/10 with fast primary growth", () => {
    const state = resolveCoreCharacteristicState({}, "mind", "detective");

    expect(state.base).toBe(6);
    expect(state.potential).toBe(10);
    expect(state.value).toBe(6);
    expect(state.modifier).toBe(1);
    expect(state.progressMax).toBe(100);
  });

  it("combines rank, core, origin, synergy, stress, and curse modifiers", () => {
    const vars = {
      [coreBaseVarKeyFor("mind")]: 6,
      [corePotentialVarKeyFor("mind")]: 10,
      [skillXpVarKeyFor("attr_logic")]: 400,
      [skillXpVarKeyFor("attr_empathy")]: 400,
      stress_index: 0.72,
      curse_pressure: 1,
    };

    const bonus = resolveEffectiveSkillCheckBonus(vars, "attr_logic", {
      originId: "detective",
      synergyId: "mind_empathy_soft_contradiction",
    });

    expect(bonus.rank).toBe("B");
    expect(bonus.rankBonus).toBe(4);
    expect(bonus.total).toBe(5);
    expect(bonus.breakdown).toEqual(
      expect.arrayContaining([
        { source: "voice", sourceId: "attr_logic", delta: 4 },
        { source: "core", sourceId: "mind", delta: 1 },
        { source: "origin", sourceId: "detective", delta: 1 },
        {
          source: "voice_synergy",
          sourceId: "mind_empathy_soft_contradiction",
          delta: 1,
        },
        { source: "stress", sourceId: "stress_index", delta: -2 },
      ]),
    );
  });

  it("applies Talker IV as an indicator modifier on inquiry social checks", () => {
    const bonus = resolveEffectiveSkillCheckBonus(
      {
        [skillXpVarKeyFor("attr_social")]: 300,
        [indicatorRankVarKeyFor("talker")]: 4,
      },
      "attr_social",
      { choiceType: "inquiry" },
    );

    expect(bonus.breakdown).toContainEqual({
      source: "indicator",
      sourceId: "talker",
      delta: 1,
    });
  });

  it("unlocks and scales cross-build synergies at C/C, B/B, and A/A", () => {
    const synergyAtC = resolveCharacterSynergyState(
      {
        [skillXpVarKeyFor("attr_logic")]: 300,
        [skillXpVarKeyFor("attr_empathy")]: 300,
      },
      "mind_empathy_soft_contradiction",
    );
    const synergyAtB = resolveCharacterSynergyState(
      {
        [skillXpVarKeyFor("attr_logic")]: 400,
        [skillXpVarKeyFor("attr_empathy")]: 400,
      },
      "mind_empathy_soft_contradiction",
    );
    const synergyAtA = resolveCharacterSynergyState(
      {
        [skillXpVarKeyFor("attr_logic")]: 500,
        [skillXpVarKeyFor("attr_empathy")]: 500,
      },
      "mind_empathy_soft_contradiction",
    );

    expect(synergyAtC).toMatchObject({ unlocked: true, modifier: 0 });
    expect(synergyAtB).toMatchObject({ unlocked: true, modifier: 1 });
    expect(synergyAtA).toMatchObject({ unlocked: true, modifier: 2 });
  });

  it("caps skill XP growth multipliers at the progression limit", () => {
    const award = resolveSkillXpAwardWithMultiplier(
      {
        [coreBaseVarKeyFor("mind")]: 10,
        [corePotentialVarKeyFor("mind")]: 10,
      },
      "attr_logic",
      100,
      "detective",
    );

    expect(award).toBeLessThanOrEqual(150);
    expect(award).toBe(145);
  });
});
