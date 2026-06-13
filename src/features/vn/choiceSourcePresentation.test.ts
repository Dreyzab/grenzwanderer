import { describe, expect, it } from "vitest";
import { resolveChoiceSourcePresentation } from "./choiceSourcePresentation";
import type { ChoiceInnerVoiceHintDisplay } from "./vnScreenTypes";
import type { VnChoice } from "./types";

const hint: ChoiceInnerVoiceHintDisplay = {
  voiceId: "inner_guide",
  label: "Guide",
  text: "Let them live.",
  stance: "supports",
  palette: {
    accent: "#34d399",
    accentSoft: "rgba(52, 211, 153, 0.16)",
    glow: "rgba(52, 211, 153, 0.24)",
    glowStrong: "rgba(110, 231, 183, 0.5)",
    text: "#d1fae5",
  },
};

const baseChoice: VnChoice = {
  id: "choice",
  text: "Hold steady.",
  nextNodeId: "next",
};

describe("resolveChoiceSourcePresentation", () => {
  it("prioritizes a skill check over authored presentation and hints", () => {
    const result = resolveChoiceSourcePresentation(
      {
        ...baseChoice,
        presentationVoiceId: "inner_leader",
        skillCheck: {
          id: "check",
          voiceId: "attr_composure",
          difficulty: 8,
        },
      },
      [hint],
      "witch",
    );

    expect(result.voiceId).toBe("attr_composure");
    expect(result.label).toBe("[ФАСАД]");
  });

  it("prioritizes authored presentation over the primary hint", () => {
    const result = resolveChoiceSourcePresentation(
      { ...baseChoice, presentationVoiceId: "inner_leader" },
      [hint],
      "witch",
    );

    expect(result.voiceId).toBe("inner_leader");
    expect(result.label).toBe("[ТРАДИЦИЯ]");
  });

  it("uses a primary hint before falling back to the category", () => {
    const result = resolveChoiceSourcePresentation(baseChoice, [hint], "witch");
    expect(result.voiceId).toBe("inner_guide");
    expect(result.label).toBe("[НЕЖНОСТЬ]");
  });

  it("presents volition without inventing a voice", () => {
    const result = resolveChoiceSourcePresentation(
      { ...baseChoice, choiceSource: "volition" },
      [],
      "witch",
    );
    expect(result).toMatchObject({
      source: "volition",
      label: "[ВОЛЯ]",
    });
    expect(result.voiceId).toBeUndefined();
  });

  it("keeps canonical labels outside a skinned preset", () => {
    const result = resolveChoiceSourcePresentation(
      { ...baseChoice, presentationVoiceId: "attr_composure" },
      [],
    );
    expect(result.label).toBe("Composure");
  });
});
