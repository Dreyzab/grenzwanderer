import { describe, expect, it } from "vitest";
import { createTestSnapshot } from "./snapshotTestUtils";
import {
  calculateSkillCheckSuccessPercent,
  getSkillCheckChanceTone,
  resolveSkillCheckDiceMode,
} from "./checkChance";

describe("checkChance", () => {
  it("resolves dice mode with scenario override before runtime default", () => {
    const snapshot = createTestSnapshot({
      vnRuntime: { skillCheckDice: "d20" },
      scenarios: [
        {
          id: "scenario_a",
          title: "Scenario A",
          startNodeId: "node_a",
          nodeIds: ["node_a"],
          skillCheckDice: "d10",
        },
      ],
      nodes: [
        {
          id: "node_a",
          scenarioId: "scenario_a",
          title: "Node A",
          body: "Body",
          choices: [],
        },
      ],
    });

    expect(resolveSkillCheckDiceMode(snapshot, "scenario_a")).toBe("d10");
  });

  it("calculates d20 chance with floored voice level", () => {
    expect(
      calculateSkillCheckSuccessPercent({
        diceMode: "d20",
        difficulty: 12,
        voiceLevel: 3.9,
      }),
    ).toBe(60);
  });

  it("returns 0 percent when the threshold exceeds the die", () => {
    expect(
      calculateSkillCheckSuccessPercent({
        diceMode: "d10",
        difficulty: 15,
        voiceLevel: 1,
      }),
    ).toBe(0);
  });

  it("returns 100 percent when the check always succeeds", () => {
    expect(
      calculateSkillCheckSuccessPercent({
        diceMode: "d20",
        difficulty: 4,
        voiceLevel: 7,
      }),
    ).toBe(100);
  });

  it("classifies chance tones by configured thresholds", () => {
    expect(getSkillCheckChanceTone(82)).toBe("confident");
    expect(getSkillCheckChanceTone(55)).toBe("risky");
    expect(getSkillCheckChanceTone(25)).toBe("critical");
  });
});
