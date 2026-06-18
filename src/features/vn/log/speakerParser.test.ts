import { describe, expect, it } from "vitest";
import {
  expandNarratorParagraphs,
  parseSpeakerSegments,
} from "./speakerParser";

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

  it("renders AI inner-voice lines as inner_voice segments via the marker round-trip", () => {
    // How runtime reflection answers reach the VN log: format as markers, reuse this parser.
    const lines = [
      { voiceId: "inner_leader", line: "Он замер, потому что понял." },
      { voiceId: "inner_guide", line: "Это не твоя вина." },
    ];
    const body = lines.map((l) => `**[${l.voiceId}]**: ${l.line}`).join("\n\n");
    const segments = parseSpeakerSegments(body);

    expect(segments).toHaveLength(2);
    expect(segments.every((s) => s.category === "inner_voice")).toBe(true);
    expect(segments[0]).toMatchObject({
      speaker: "inner_leader",
      text: "Он замер, потому что понял.",
    });
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
        speakerLabel: "Felix",
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
      accentSoftColor: "rgba(248, 113, 113, 0.16)",
      glowColor: "rgba(248, 113, 113, 0.24)",
      textColor: "#fee2e2",
    });
  });

  it("recognizes canonical skill speakers as method voices", () => {
    const segments = parseSpeakerSegments(
      "**[attr_composure]**:\nHold the mask steady.",
    );

    expect(segments).toMatchObject([
      {
        speaker: "attr_composure",
        speakerLabel: "Composure",
        category: "method_voice",
        text: "Hold the mask steady.",
      },
    ]);
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

  it("maps inspector marker to player (playable detective voice)", () => {
    const segments = parseSpeakerSegments(
      "**[Assistant]**:\nHello.\n\n**[inspector]**:\nMy line.",
    );
    expect(segments).toMatchObject([
      { speaker: "Assistant", category: "npc", text: "Hello." },
      { speaker: "inspector", category: "player", text: "My line." },
    ]);
  });
});

describe("expandNarratorParagraphs", () => {
  it("splits multi-paragraph narrator blocks for assessment", () => {
    const segments = parseSpeakerSegments(
      "**[Narrator]**:\nFirst beat.\n\nSecond beat.\n\nThird beat.\n\n**[inner_cynic]**:\nOne thought.",
    );

    expect(expandNarratorParagraphs(segments)).toMatchObject([
      { category: "narrator", text: "First beat." },
      { category: "narrator", text: "Second beat." },
      { category: "narrator", text: "Third beat." },
      { category: "inner_voice", text: "One thought." },
    ]);
  });

  it("keeps single-paragraph narrator and non-narrator segments unchanged", () => {
    const segments = parseSpeakerSegments(
      "**[Narrator]**:\nOnly one beat.\n\n**[Assistant]**:\nHello.",
    );

    expect(expandNarratorParagraphs(segments)).toMatchObject([
      { category: "narrator", text: "Only one beat." },
      { category: "npc", text: "Hello." },
    ]);
  });
});
