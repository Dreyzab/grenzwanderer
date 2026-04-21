import { describe, expect, it } from "vitest";

import {
  resolveLegacyScenarioId,
  resolveScenarioForPoint,
} from "./scenario-mapping";

describe("scenario-mapping", () => {
  it("maps Case01 legacy ids to dedicated runtime scenarios", () => {
    expect(resolveLegacyScenarioId("detective_case1_hbf_arrival")).toBe(
      "case01_hbf_arrival",
    );
    expect(resolveLegacyScenarioId("detective_case1_bank_scene")).toBe(
      "case01_bank_investigation",
    );
    expect(resolveLegacyScenarioId("lead_tailor")).toBe("case01_lead_tailor");
    expect(resolveLegacyScenarioId("case1_finale")).toBe(
      "case01_warehouse_finale",
    );
  });

  it("returns null for legacy ids intentionally removed from supported mainline", () => {
    const availableScenarioIds = new Set([
      "case01_hbf_arrival",
      "case01_bank_investigation",
    ]);

    expect(
      resolveScenarioForPoint(["quest_victoria_poetry"], availableScenarioIds),
    ).toBeNull();
    expect(
      resolveScenarioForPoint(["quest_lotte_wires"], availableScenarioIds),
    ).toBeNull();
  });
});
