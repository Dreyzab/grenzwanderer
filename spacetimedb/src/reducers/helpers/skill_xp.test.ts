import { describe, expect, it, vi } from "vitest";

import {
  createReducerTestContext,
  insertVar,
  playerKey,
} from "./__tests__/serverTestContext";

vi.mock("spacetimedb/server", () => ({
  SenderError: class SenderError extends Error {},
}));

import {
  awardSkillCheckPracticeXp,
  grantSkillXpInternal,
} from "./skill_xp";

describe("skill XP backend helpers", () => {
  it("awards active skill-check success practice XP", () => {
    const ctx = createReducerTestContext();

    const award = awardSkillCheckPracticeXp(ctx, {
      activeChoice: true,
      voiceId: "attr_logic",
      outcomeGrade: "success",
    });

    expect(award).toMatchObject({
      skillId: "attr_logic",
      amount: 25,
      totalXp: 25,
    });
    expect(
      ctx.db.playerVar.varId.find(playerKey(ctx.sender, "skill_xp_attr_logic")),
    ).toMatchObject({
      key: "skill_xp_attr_logic",
      floatValue: 25,
    });
  });

  it("awards more practice XP for active skill-check failures", () => {
    const ctx = createReducerTestContext();

    awardSkillCheckPracticeXp(ctx, {
      activeChoice: true,
      voiceId: "attr_deception",
      outcomeGrade: "fail",
    });

    expect(
      ctx.db.playerVar.varId.find(
        playerKey(ctx.sender, "skill_xp_attr_deception"),
      ),
    ).toMatchObject({
      key: "skill_xp_attr_deception",
      floatValue: 35,
    });
  });

  it("does not award automatic XP for passive checks", () => {
    const ctx = createReducerTestContext();

    const award = awardSkillCheckPracticeXp(ctx, {
      activeChoice: false,
      voiceId: "attr_perception",
      outcomeGrade: "critical",
    });

    expect(award).toBeNull();
    expect(ctx.db.playerVar.rows()).toHaveLength(0);
  });

  it("falls back from legacy attr values until a real skill XP var exists", () => {
    const ctx = createReducerTestContext();
    insertVar(ctx, "attr_perception", 4);

    awardSkillCheckPracticeXp(ctx, {
      activeChoice: true,
      voiceId: "attr_perception",
      outcomeGrade: "success_with_cost",
    });

    expect(
      ctx.db.playerVar.varId.find(
        playerKey(ctx.sender, "skill_xp_attr_perception"),
      ),
    ).toMatchObject({
      key: "skill_xp_attr_perception",
      floatValue: 425,
    });
  });

  it("caps skill XP at SS 100/100", () => {
    const ctx = createReducerTestContext();
    insertVar(ctx, "skill_xp_attr_logic", 790);

    awardSkillCheckPracticeXp(ctx, {
      activeChoice: true,
      voiceId: "attr_logic",
      outcomeGrade: "fail",
    });

    expect(
      ctx.db.playerVar.varId.find(playerKey(ctx.sender, "skill_xp_attr_logic")),
    ).toMatchObject({
      key: "skill_xp_attr_logic",
      floatValue: 800,
    });
  });

  it("validates explicit skill XP grants", () => {
    const ctx = createReducerTestContext();

    expect(() => grantSkillXpInternal(ctx, "unknown_skill", 20)).toThrow(
      /Unknown skill id/,
    );
    expect(() => grantSkillXpInternal(ctx, "attr_logic", 0)).toThrow(
      /positive/,
    );
    expect(() =>
      grantSkillXpInternal(ctx, "attr_logic", Number.NaN),
    ).toThrow(/finite/);
  });
});
