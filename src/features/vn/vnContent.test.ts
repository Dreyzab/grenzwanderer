import { describe, expect, it } from "vitest";
import { parseSnapshot } from "./vnContent";

describe("vnContent runtime parsing", () => {
  it("parses snapshot-level vnRuntime.skillCheckDice", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        schemaVersion: 2,
        scenarios: [],
        nodes: [],
        vnRuntime: {
          skillCheckDice: "d10",
          defaultEntryScenarioId: "sandbox_case01_pilot",
        },
        mindPalace: {
          cases: [],
          facts: [],
          hypotheses: [],
        },
      }),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.vnRuntime?.skillCheckDice).toBe("d10");
    expect(parsed?.vnRuntime?.defaultEntryScenarioId).toBe(
      "sandbox_case01_pilot",
    );
  });

  it("parses scenario-level skillCheckDice override", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        schemaVersion: 2,
        scenarios: [
          {
            id: "scenario_a",
            title: "Scenario A",
            startNodeId: "node_a",
            nodeIds: ["node_a"],
            skillCheckDice: "d10",
          },
        ],
        nodes: [
          {
            id: "node_a",
            scenarioId: "scenario_a",
            title: "Node A",
            body: "Body",
            choices: [],
          },
        ],
        mindPalace: {
          cases: [],
          facts: [],
          hypotheses: [],
        },
      }),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.scenarios[0]?.skillCheckDice).toBe("d10");
  });

  it("keeps backward compatibility for snapshots without vnRuntime", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        schemaVersion: 2,
        scenarios: [
          {
            id: "scenario_a",
            title: "Scenario A",
            startNodeId: "node_a",
            nodeIds: ["node_a"],
          },
        ],
        nodes: [
          {
            id: "node_a",
            scenarioId: "scenario_a",
            title: "Node A",
            body: "Body",
            choices: [],
          },
        ],
        mindPalace: {
          cases: [],
          facts: [],
          hypotheses: [],
        },
      }),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.vnRuntime).toBeUndefined();
  });
});
