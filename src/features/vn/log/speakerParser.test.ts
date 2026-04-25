import { describe, expect, it } from "vitest";
import { parseSpeakerSegments } from "./speakerParser";

describe("parseSpeakerSegments", () => {
  it("treats unmarked text as narrator text", () => {
    expect(
      parseSpeakerSegments("Steam gathers under the station roof."),
    ).toEqual([
      {
        speaker: "Narrator",
        speakerLabel: "Narrator",
        category: "narrator",
        text: "Steam gathers under the station roof.",
      },
    ]);
  });

  it("splits mixed speaker blocks", () => {
    const segments = parseSpeakerSegments(
      "**[Narrator]**:\nThe door opens.\n\n**[Assistant]**:\nNo headlines today.",
    );

    expect(segments).toMatchObject([
      {
        speaker: "Narrator",
        speakerLabel: "Narrator",
        category: "narrator",
        text: "The door opens.",
      },
      {
        speaker: "Assistant",
        speakerLabel: "Assistant",
        category: "npc",
        text: "No headlines today.",
      },
    ]);
  });

  it("adds inner voice labels and palette colors", () => {
    const segments = parseSpeakerSegments(
      "**[inner_cynic]**:\nTrust costs more than leverage.",
    );

    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      speaker: "inner_cynic",
      speakerLabel: "Cynic",
      category: "inner_voice",
      text: "Trust costs more than leverage.",
      accentColor: "#f87171",
      textColor: "#fee2e2",
    });
  });

  it("keeps narrator text before the first explicit speaker", () => {
    const segments = parseSpeakerSegments(
      "A pause.\n\n**[Assistant]**:\nWe are nearly there.",
    );

    expect(segments).toMatchObject([
      {
        speaker: "Narrator",
        category: "narrator",
        text: "A pause.",
      },
      {
        speaker: "Assistant",
        category: "npc",
        text: "We are nearly there.",
      },
    ]);
  });

  it("drops empty speaker blocks", () => {
    expect(parseSpeakerSegments("**[Narrator]**:\n\n")).toEqual([]);
  });
});
