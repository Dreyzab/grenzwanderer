import { describe, expect, it } from "vitest";

import {
  APPROACH_WEIGHT,
  INNER_VOICE_SILENCE_THRESHOLD,
} from "../../../data/innerVoiceContract";
import {
  resonanceForInnerVoice,
  resolveInnerVoiceSelection,
} from "./innerVoiceModel";

describe("innerVoiceModel", () => {
  it("uses weighted approach distance for resonance", () => {
    const resonance = resonanceForInnerVoice(
      { axisX: 70, axisY: 70, approach: 0 },
      "inner_leader",
    );

    expect(APPROACH_WEIGHT).toBe(0.6);
    expect(resonance).toBeCloseTo(1 / 43, 4);
  });

  it("selects dominant, support, and counter voices from an inner pool", () => {
    const selection = resolveInnerVoiceSelection(
      { axisX: 70, axisY: 60, approach: 65 },
      ["inner_leader", "inner_guide", "inner_cynic"],
      { includeCounter: true },
    );

    expect(selection.dominant?.voiceId).toBe("inner_leader");
    expect(selection.support?.voiceId).toBe("inner_guide");
    expect(selection.counter?.voiceId).toBe("inner_cynic");
  });

  it("falls back cleanly when the pool has no opposing quadrant", () => {
    const selection = resolveInnerVoiceSelection(
      { axisX: 65, axisY: 70, approach: 55 },
      ["inner_leader", "inner_guide"],
      { includeCounter: true },
    );

    expect(selection.dominant?.voiceId).toBe("inner_leader");
    expect(selection.support?.voiceId).toBe("inner_guide");
    expect(selection.counter).toBeNull();
  });

  it("respects the silence threshold but still keeps one fallback voice", () => {
    const selection = resolveInnerVoiceSelection(
      { axisX: 100, axisY: 100, approach: 100 },
      ["inner_cynic", "inner_exile"],
      { silenceThreshold: 0.5 },
    );

    expect(INNER_VOICE_SILENCE_THRESHOLD).toBe(0.005);
    expect(selection.ordered).toHaveLength(1);
    expect(selection.dominant?.voiceId).toBe("inner_cynic");
  });
});
