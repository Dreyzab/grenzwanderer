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
        "Dear detective.\n\nI await your swift arrival in Freiburg.\n\n\nWith respect,\nMaster",
      ),
    ).toBe(
      "Dear detective.\n\nI await your swift arrival in Freiburg.\n\nWith respect,\nMaster",
    );
  });
});
