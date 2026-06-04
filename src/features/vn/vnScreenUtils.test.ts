import { describe, expect, it } from "vitest";
import type { VnChoice } from "./types";
import {
  normalizeBody,
  normalizeLetterBody,
  resolveEffectiveAutoContinueChoice,
} from "./vnScreenUtils";

describe("VN body normalization", () => {
  it("keeps default narration compact", () => {
    expect(normalizeBody("Line one.\n\nLine two.\tLine three.")).toBe(
      "Line one. Line two. Line three.",
    );
  });

  it("preserves letter paragraph breaks", () => {
    expect(
      normalizeLetterBody(
        "Dear detective.\n\nI await your swift arrival in Freiburg.\n\n\nWith respect,\nMaster",
      ),
    ).toBe(
      "Dear detective.\n\nI await your swift arrival in Freiburg.\n\nWith respect,\nMaster",
    );
  });
});

describe("resolveEffectiveAutoContinueChoice", () => {
  it("prefers visible AUTO_CONTINUE choices", () => {
    const choices: VnChoice[] = [
      {
        id: "AUTO_CONTINUE_NEXT",
        text: "Continue.",
        nextNodeId: "next",
      },
      {
        id: "CASE01_WITCH_START_TO_DROWSE",
        text: "Continue.",
        nextNodeId: "witch",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true },
        ],
      },
    ];

    expect(
      resolveEffectiveAutoContinueChoice(choices, {}, {}, undefined)?.id,
    ).toBe("AUTO_CONTINUE_NEXT");
  });

  it("falls back to a sole visible implicit continue branch", () => {
    const choices: VnChoice[] = [
      {
        id: "AUTO_CONTINUE_DEFAULT",
        text: "Continue.",
        nextNodeId: "default",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: "origin_witch",
              value: true,
            },
          },
        ],
      },
      {
        id: "CASE01_WITCH_START_TO_DROWSE",
        text: "Continue.",
        nextNodeId: "witch",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true },
        ],
      },
    ];

    expect(
      resolveEffectiveAutoContinueChoice(
        choices,
        { origin_witch: true },
        {},
        undefined,
      )?.id,
    ).toBe("CASE01_WITCH_START_TO_DROWSE");
  });
});
