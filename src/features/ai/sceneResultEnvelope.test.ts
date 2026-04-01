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
          psyche: {
            axisX: 48,
            axisY: -12,
            approach: 60,
            dominantInnerVoiceId: "inner_analyst",
            activeInnerVoiceIds: ["inner_analyst", "inner_cynic"],
          },
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

  it("rejects malformed psyche payloads", () => {
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
          psyche: {
            axisX: 12,
            axisY: 18,
            approach: "bad",
            dominantInnerVoiceId: "inner_guide",
            activeInnerVoiceIds: [],
          },
        },
      }),
    ).toBe(false);
  });
});
