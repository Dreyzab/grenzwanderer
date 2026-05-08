import { describe, expect, it } from "vitest";

import { SKILL_VOICE_IDS } from "../../../data/innerVoiceContract";
import {
  SKILL_XP_CAP,
  normalizeSkillXpForInfluence,
  resolveSkillRank,
  isSkillRankAtLeast,
  isSkillRankGateSatisfiedFromVars,
  skillXpVarKeyFor,
} from "./skillProgression";

describe("skillProgression", () => {
  it("resolves F to SS rank progress with safe clamping", () => {
    expect(resolveSkillRank(0)).toMatchObject({
      totalXp: 0,
      rank: "F",
      rankIndex: 0,
      progress: 0,
      progressMax: 100,
      isMaxRank: false,
    });
    expect(resolveSkillRank(99)).toMatchObject({
      rank: "F",
      progress: 99,
    });
    expect(resolveSkillRank(100)).toMatchObject({
      rank: "E",
      progress: 0,
    });
    expect(resolveSkillRank(445)).toMatchObject({
      rank: "B",
      rankIndex: 4,
      progress: 45,
    });
    expect(resolveSkillRank(800)).toMatchObject({
      totalXp: SKILL_XP_CAP,
      rank: "SS",
      progress: 100,
      isMaxRank: true,
    });
    expect(resolveSkillRank(900)).toMatchObject({
      totalXp: SKILL_XP_CAP,
      rank: "SS",
      progress: 100,
    });
    expect(resolveSkillRank(-10)).toMatchObject({
      totalXp: 0,
      rank: "F",
      progress: 0,
    });
    expect(resolveSkillRank(Number.NaN)).toMatchObject({
      totalXp: 0,
      rank: "F",
      progress: 0,
    });
  });

  it("derives an XP var key for every skill voice id", () => {
    for (const skillId of SKILL_VOICE_IDS) {
      expect(skillXpVarKeyFor(skillId)).toBe(`skill_xp_${skillId}`);
    }
  });

  it("normalizes XP into influence-scale practice values", () => {
    expect(normalizeSkillXpForInfluence(400)).toBe(4);
    expect(normalizeSkillXpForInfluence(900)).toBe(8);
    expect(normalizeSkillXpForInfluence(Number.NaN)).toBe(0);
  });

  it("compares rank gates and resolves saved XP with legacy attr fallback", () => {
    expect(isSkillRankAtLeast("B", "C")).toBe(true);
    expect(isSkillRankAtLeast("C", "B")).toBe(false);
    expect(
      isSkillRankGateSatisfiedFromVars({ attr_logic: 4 }, "attr_logic", "B"),
    ).toBe(true);
    expect(
      isSkillRankGateSatisfiedFromVars(
        { attr_logic: 4, skill_xp_attr_logic: 150 },
        "attr_logic",
        "B",
      ),
    ).toBe(false);
  });
});
