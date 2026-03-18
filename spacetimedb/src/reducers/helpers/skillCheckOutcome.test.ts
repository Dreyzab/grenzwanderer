import { describe, expect, it } from "vitest";

import { resolveSkillCheckOutcome } from "./skillCheckOutcome";

describe("resolveSkillCheckOutcome", () => {
  it("preserves binary behavior when outcomeModel is omitted", () => {
    const result = resolveSkillCheckOutcome({
      check: {
        onSuccess: { nextNodeId: "node_success" },
        onFail: { nextNodeId: "node_fail" },
      },
      passed: true,
      margin: 1,
    });

    expect(result.outcomeGrade).toBe("success");
    expect(result.outcome?.nextNodeId).toBe("node_success");
    expect(result.costEffects).toBeUndefined();
  });

  it("routes failed tiered checks to the fail branch", () => {
    const result = resolveSkillCheckOutcome({
      check: {
        outcomeModel: "tiered",
        onSuccess: { nextNodeId: "node_success" },
        onFail: { nextNodeId: "node_fail" },
        onCritical: { nextNodeId: "node_critical" },
        onSuccessWithCost: {
          nextNodeId: "node_cost",
          costEffects: [{ type: "add_heat", amount: 1 }],
        },
      },
      passed: false,
      margin: -2,
    });

    expect(result.outcomeGrade).toBe("fail");
    expect(result.outcome?.nextNodeId).toBe("node_fail");
  });

  it("routes strong tiered success to the critical branch", () => {
    const result = resolveSkillCheckOutcome({
      check: {
        outcomeModel: "tiered",
        onSuccess: { nextNodeId: "node_success" },
        onFail: { nextNodeId: "node_fail" },
        onCritical: { nextNodeId: "node_critical" },
      },
      passed: true,
      margin: 5,
    });

    expect(result.outcomeGrade).toBe("critical");
    expect(result.outcome?.nextNodeId).toBe("node_critical");
  });

  it("routes narrow tiered success to the cost branch and returns cost effects", () => {
    const result = resolveSkillCheckOutcome({
      check: {
        outcomeModel: "tiered",
        onSuccess: { nextNodeId: "node_success" },
        onFail: { nextNodeId: "node_fail" },
        onSuccessWithCost: {
          nextNodeId: "node_cost",
          effects: [{ type: "grant_xp", amount: 1 }],
          costEffects: [{ type: "add_tension", amount: 2 }],
        },
      },
      passed: true,
      margin: 2,
    });

    expect(result.outcomeGrade).toBe("success_with_cost");
    expect(result.outcome?.nextNodeId).toBe("node_cost");
    expect(result.costEffects).toEqual([{ type: "add_tension", amount: 2 }]);
  });

  it("falls back to normal success when optional tiered branches are absent", () => {
    const result = resolveSkillCheckOutcome({
      check: {
        outcomeModel: "tiered",
        onSuccess: { nextNodeId: "node_success" },
        onFail: { nextNodeId: "node_fail" },
      },
      passed: true,
      margin: 1,
    });

    expect(result.outcomeGrade).toBe("success");
    expect(result.outcome?.nextNodeId).toBe("node_success");
  });
});
