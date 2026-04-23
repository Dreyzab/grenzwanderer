import { describe, expect, it } from "vitest";
import { normalizeBody, normalizeLetterBody } from "./vnScreenUtils";

describe("VN body normalization", () => {
  it("keeps default narration compact", () => {
    expect(normalizeBody("Line one.\n\nLine two.\tLine three.")).toBe(
      "Line one. Line two. Line three.",
    );
  });

  it("preserves letter paragraph breaks", () => {
    expect(
      normalizeLetterBody(
        "Dear detective,\r\n\r\nI insist that you reach Freiburg.\n\n\nWith respect,\nMaster",
      ),
    ).toBe(
      "Dear detective,\n\nI insist that you reach Freiburg.\n\nWith respect,\nMaster",
    );
  });
});
