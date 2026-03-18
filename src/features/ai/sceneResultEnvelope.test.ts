import { describe, expect, it } from "vitest";

import { isValidSceneResultEnvelope } from "./sceneResultEnvelope";

describe("sceneResultEnvelope", () => {
  it("accepts a fully populated envelope with skill-check facts", () => {
    expect(
      isValidSceneResultEnvelope({
        source: "skill_check",
        scenarioId: "haunted_manor",
        nodeId: "foyer_check",
        locationName: "Foyer",
        timestamp: 1742324400,
        playerState: {
          flags: ["met_butler"],
          activeQuests: [{ questId: "quest_manor", stage: 2 }],
          voiceLevels: { attr_logic: 4 },
        },
        checkResult: {
          checkId: "check_hidden_latch",
          voiceId: "attr_logic",
          outcomeGrade: "success_with_cost",
          margin: 2,
          breakdown: [
            { source: "voice", sourceId: "attr_logic", delta: 4 },
            { source: "item", sourceId: "lockpick_set", delta: 1 },
          ],
        },
        ensemble: {
          presenceMode: "parliament",
          activeSpeakers: ["attr_logic", "attr_empathy"],
        },
      }),
    ).toBe(true);
  });

  it("rejects invalid outcome grades", () => {
    expect(
      isValidSceneResultEnvelope({
        source: "skill_check",
        scenarioId: "haunted_manor",
        locationName: "Foyer",
        timestamp: 1742324400,
        playerState: {
          flags: [],
          activeQuests: [],
          voiceLevels: {},
        },
        checkResult: {
          checkId: "check_hidden_latch",
          voiceId: "attr_logic",
          outcomeGrade: "partial_success",
          margin: 1,
          breakdown: [],
        },
      }),
    ).toBe(false);
  });

  it("rejects invalid ensemble speaker collections", () => {
    expect(
      isValidSceneResultEnvelope({
        source: "scene_result",
        scenarioId: "haunted_manor",
        locationName: "Cellar",
        timestamp: 1742324400,
        playerState: {
          flags: [],
          activeQuests: [],
          voiceLevels: {},
        },
        ensemble: {
          presenceMode: "mechanical_voice",
          activeSpeakers: "attr_logic",
        },
      }),
    ).toBe(false);
  });
});
