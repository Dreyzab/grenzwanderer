import { describe, expect, it } from "vitest";

import {
  RESOURCE_FATE_TOKEN_VAR,
  isNarrativeResourceKey,
  normalizeNarrativeResourceValue,
  resolveKarmaDifficultyDeltaForMove,
} from "./narrativeResources";

describe("narrative resources", () => {
  it("registers Fate tokens as a distinct narrative resource", () => {
    expect(isNarrativeResourceKey(RESOURCE_FATE_TOKEN_VAR)).toBe(true);
    expect(normalizeNarrativeResourceValue(RESOURCE_FATE_TOKEN_VAR, 99)).toBe(
      9,
    );
  });

  it("lets negative karma help selfish survival moves for an individualist psyche", () => {
    expect(
      resolveKarmaDifficultyDeltaForMove(-60, -35, ["selfish", "survival"]),
    ).toBe(-2);
  });

  it("keeps positive karma helping protective or cooperative moves", () => {
    expect(resolveKarmaDifficultyDeltaForMove(60, -35, ["protective"])).toBe(
      -2,
    );
  });

  it("penalizes protective moves when karma is stained", () => {
    expect(resolveKarmaDifficultyDeltaForMove(-60, -35, ["cooperative"])).toBe(
      2,
    );
  });
});
