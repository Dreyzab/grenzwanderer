import { describe, expect, it } from "vitest";

import {
  CASE01_DIRECTOR_BRIDGE_FALLBACK_BEAT_IDS,
  CASE01_SCENARIO_IDS,
  buildDirectorAllowedBeatIds,
  isCanonicalDirectorAllowedBeatList,
  isCase01CanonScenarioId,
} from "./case01Canon";

describe("case01 canon director allowed beats", () => {
  it("keeps the bridge fallback list inside the Case01 scenario canon", () => {
    const canon = new Set(Object.values(CASE01_SCENARIO_IDS));
    for (const id of CASE01_DIRECTOR_BRIDGE_FALLBACK_BEAT_IDS) {
      expect(canon.has(id)).toBe(true);
    }
  });

  it("covers every authored Case01 scenario in the bridge fallback list", () => {
    const fallback = new Set<string>(CASE01_DIRECTOR_BRIDGE_FALLBACK_BEAT_IDS);
    for (const id of Object.values(CASE01_SCENARIO_IDS)) {
      expect(fallback.has(id)).toBe(true);
    }
  });

  it("recognizes Case01 scenario ids", () => {
    expect(isCase01CanonScenarioId(CASE01_SCENARIO_IDS.defaultEntry)).toBe(
      true,
    );
    expect(isCase01CanonScenarioId("sandbox_case01_pilot")).toBe(false);
  });

  it("unions snapshot scenarios with bridge fallback and filters off-canon entries", () => {
    const allowed = buildDirectorAllowedBeatIds([
      CASE01_SCENARIO_IDS.warehouseFinale,
      "sandbox_off_canon",
    ]);

    expect(allowed).toContain(CASE01_SCENARIO_IDS.warehouseFinale);
    expect(allowed).toContain(CASE01_SCENARIO_IDS.defaultEntry);
    expect(allowed).not.toContain("sandbox_off_canon");
  });

  it("rejects allowed beat lists that contain non-canon ids", () => {
    expect(
      isCanonicalDirectorAllowedBeatList([
        CASE01_SCENARIO_IDS.defaultEntry,
        "sandbox_off_canon",
      ]),
    ).toBe(false);
    expect(
      isCanonicalDirectorAllowedBeatList([CASE01_SCENARIO_IDS.defaultEntry]),
    ).toBe(true);
    expect(isCanonicalDirectorAllowedBeatList([])).toBe(false);
  });
});
