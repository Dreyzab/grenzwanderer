import { describe, expect, it } from "vitest";

import { getFactionIdValidationError } from "./factionSignalGuard";

describe("getFactionIdValidationError", () => {
  it("rejects unknown faction ids with the reducer error message", () => {
    expect(getFactionIdValidationError("bogus_faction")).toBe(
      "Unsupported factionId: bogus_faction",
    );
  });
});
