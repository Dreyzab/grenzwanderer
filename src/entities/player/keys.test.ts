import { describe, expect, it } from "vitest";
import {
  PLAYER_KEY_ALIASES,
  isKnownPlayerFlagKey,
  isKnownPlayerVarKey,
} from "./keys";
import {
  pickCase01Flags,
  pickCharacterProgressVars,
  pickLegacyReputationVars,
} from "./selectors";

describe("player key registry", () => {
  it("recognizes canonical case, origin, attribute, and legacy reputation keys", () => {
    expect(isKnownPlayerFlagKey("case_resolved")).toBe(true);
    expect(isKnownPlayerFlagKey("origin_journalist")).toBe(true);
    expect(isKnownPlayerVarKey("attr_intellect")).toBe(true);
    expect(isKnownPlayerVarKey("agency_standing")).toBe(true);
    expect(isKnownPlayerVarKey("rep_underworld")).toBe(true);
  });

  it("keeps compatibility aliases explicit", () => {
    expect(isKnownPlayerFlagKey("INTRO_COMPLETED")).toBe(true);
    expect(PLAYER_KEY_ALIASES).toContainEqual({
      kind: "flag",
      aliasKey: "INTRO_COMPLETED",
      canonicalKey: "intro_freiburg_done",
      removal:
        "Remove after all debug/demo surfaces stop checking uppercase intro state.",
    });
  });

  it("exposes narrow selectors for feature-owned state", () => {
    expect(
      pickCase01Flags({ case_resolved: true, origin_journalist: true })
        .case_resolved,
    ).toBe(true);
    expect(
      pickCharacterProgressVars({
        checks_passed: 2,
        checks_failed: 1,
        stress_index: 3,
      }),
    ).toEqual({
      checksPassed: 2,
      checksFailed: 1,
      caseProgress: 0,
      stressIndex: 3,
    });
    expect(pickLegacyReputationVars({ rep_civic: 4 })).toEqual({
      civic_order: 4,
      financial_bloc: 0,
      underworld: 0,
    });
  });
});
