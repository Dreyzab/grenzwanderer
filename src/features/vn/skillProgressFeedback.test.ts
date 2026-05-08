import { describe, expect, it } from "vitest";

import {
  buildSkillProgressFeedback,
  formatSkillProgressStatus,
  resolvePracticeXpForSkillResult,
} from "./skillProgressFeedback";

describe("skillProgressFeedback", () => {
  it("uses fail-forward XP for failed active results", () => {
    expect(
      resolvePracticeXpForSkillResult({
        outcomeGrade: "fail",
        passed: false,
      }),
    ).toBe(35);
  });

  it("builds rank-up feedback from a stored skill XP baseline", () => {
    const feedback = buildSkillProgressFeedback({
      pending: {
        voiceId: "attr_deception",
        voiceLabel: "Deception",
      },
      matchedResult: {
        outcomeGrade: "success",
        passed: true,
      },
      vars: { skill_xp_attr_deception: 490 },
      baselineXp: 490,
    });

    expect(feedback).toMatchObject({
      skillId: "attr_deception",
      skillLabel: "Deception",
      xpAwarded: 25,
      xpGained: 25,
      totalXp: 515,
      rankUp: true,
    });
    expect(feedback?.rankBefore.rank).toBe("B");
    expect(feedback?.rankAfter.rank).toBe("A");
    expect(formatSkillProgressStatus(feedback!)).toBe(
      "Rank up: Deception B -> A (+25 XP)",
    );
  });

  it("ignores legacy non-method voice ids for skill progression feedback", () => {
    expect(
      buildSkillProgressFeedback({
        pending: {
          voiceId: "charisma",
          voiceLabel: "Charisma",
        },
        matchedResult: {
          outcomeGrade: "success",
          passed: true,
        },
        vars: { charisma: 4 },
      }),
    ).toBeNull();
  });
});
