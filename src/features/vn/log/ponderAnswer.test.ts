import { describe, expect, it } from "vitest";
import {
  buildPonderAnswerSegments,
  buildPonderDmPayload,
  ponderProposalToSegments,
} from "./ponderAnswer";
import { resolveOverallInnerVoiceSelection } from "../../../shared/game/innerVoiceModel";

describe("buildPonderAnswerSegments", () => {
  it("voices the resolved DM parliament as inner_voice segments", () => {
    const vars = {}; // origin psyche
    const expected = resolveOverallInnerVoiceSelection(vars).ordered;
    const segments = buildPonderAnswerSegments("Почему он застыл?", vars);

    expect(segments).toHaveLength(expected.length);
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.every((s) => s.category === "inner_voice")).toBe(true);
    expect(segments.map((s) => s.speaker)).toEqual(
      expected.map((entry) => entry.voiceId),
    );
    expect(segments.some((s) => s.text.includes("Почему он застыл?"))).toBe(
      true,
    );
  });
});

describe("buildPonderDmPayload", () => {
  it("addresses the parliament with the question on a debate beat", () => {
    const payload = buildPonderDmPayload({
      scenarioId: "case01",
      nodeId: "coin_wake",
      question: "Почему он застыл?",
      resources: { fate: 6, fortune: 0, fortuneMod: -1, karma: -10 },
      vars: {},
      flags: {},
      visibleFacts: ["монета — его вина"],
    });

    expect(payload.actionText).toBe("Почему он застыл?");
    expect(payload.beatDirective?.kind).toBe("debate_options");
    expect(payload.innerVoices?.length).toBeGreaterThan(0);
    expect(payload.psyche.activeInnerVoiceIds).toEqual(
      payload.innerVoices?.map((voice) => voice.voiceId),
    );
    expect(payload.visibleFacts).toContain("монета — его вина");
  });
});

describe("ponderProposalToSegments", () => {
  it("renders the AI inner-voice debate as inner_voice segments", () => {
    const segments = ponderProposalToSegments({
      narration: "",
      innerVoiceDialogue: [
        {
          voiceId: "inner_guide",
          stance: "supports",
          line: "Это не твоя вина.",
        },
        {
          voiceId: "inner_cynic",
          stance: "opposes",
          line: "Хватит себя жалеть.",
        },
      ],
      checks: [],
      sessionFacts: [],
      suggestedStateDeltas: [],
      risks: [],
      toneMode: "safe_chekhovian",
      canonRemarks: [],
    });

    expect(segments).toHaveLength(2);
    expect(segments.every((s) => s.category === "inner_voice")).toBe(true);
    expect(segments[1]?.text).toBe("Хватит себя жалеть.");
  });
});
