import { describe, expect, it } from "vitest";
import {
  deriveHypothesisState,
  parseRequiredFactIds,
  parseRequiredVars,
  type RequiredVar,
} from "./readiness";

describe("mindpalace readiness model", () => {
  it("parses required fact ids and ignores malformed payloads", () => {
    expect(parseRequiredFactIds('["fact_1","fact_2"]')).toEqual([
      "fact_1",
      "fact_2",
    ]);
    expect(parseRequiredFactIds('{"fact":"wrong"}')).toEqual([]);
    expect(parseRequiredFactIds("not-json")).toEqual([]);
  });

  it("parses required vars and ignores invalid entries", () => {
    const parsed = parseRequiredVars(
      '[{"key":"attr_logic","op":"gte","value":2},{"key":"x","op":"bad","value":1}]',
    );
    expect(parsed).toEqual([{ key: "attr_logic", op: "gte", value: 2 }]);
  });

  it("derives ready when all facts and vars pass", () => {
    const requiredVars: RequiredVar[] = [{ key: "attr_logic", op: "gte", value: 2 }];
    const state = deriveHypothesisState({
      requiredFactIds: ["fact_a"],
      requiredVars,
      discoveredFactIds: new Set(["fact_a"]),
      varsByKey: { attr_logic: 3 },
      validated: false,
    });

    expect(state.ready).toBe(true);
    expect(state.validated).toBe(false);
    expect(state.missingFacts).toEqual([]);
    expect(state.failedVars).toEqual([]);
  });

  it("derives missing facts and failed vars", () => {
    const state = deriveHypothesisState({
      requiredFactIds: ["fact_a", "fact_b"],
      requiredVars: [{ key: "attr_logic", op: "gte", value: 4 }],
      discoveredFactIds: new Set(["fact_a"]),
      varsByKey: { attr_logic: 2 },
      validated: false,
    });

    expect(state.ready).toBe(false);
    expect(state.missingFacts).toEqual(["fact_b"]);
    expect(state.failedVars).toHaveLength(1);
  });

  it("keeps validated flag in output", () => {
    const state = deriveHypothesisState({
      requiredFactIds: [],
      requiredVars: [],
      discoveredFactIds: new Set(),
      varsByKey: {},
      validated: true,
    });
    expect(state.validated).toBe(true);
    expect(state.ready).toBe(true);
  });
});
