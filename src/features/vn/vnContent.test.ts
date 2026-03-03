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

  it("parses schema v3 snapshot with map block", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        schemaVersion: 3,
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
        map: {
          defaultRegionId: "FREIBURG_1905",
          regions: [
            {
              id: "FREIBURG_1905",
              name: "Freiburg",
              geoCenterLat: 47.9959,
              geoCenterLng: 7.8522,
              zoom: 14.2,
            },
          ],
          points: [
            {
              id: "loc_hbf",
              title: "Hauptbahnhof",
              regionId: "FREIBURG_1905",
              lat: 47.99,
              lng: 7.84,
              locationId: "loc_hbf",
              bindings: [
                {
                  id: "sys_travel_loc_hbf",
                  trigger: "card_secondary",
                  label: "Travel",
                  priority: 10,
                  intent: "travel",
                  actions: [{ type: "travel_to", locationId: "loc_hbf" }],
                },
              ],
            },
          ],
        },
      }),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.map?.defaultRegionId).toBe("FREIBURG_1905");
    expect(parsed?.map?.points[0]?.bindings[0]?.id).toBe("sys_travel_loc_hbf");
  });

  it("rejects schema v3 snapshot without map block", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        schemaVersion: 3,
        scenarios: [],
        nodes: [],
        mindPalace: {
          cases: [],
          facts: [],
          hypotheses: [],
        },
      }),
    );

    expect(parsed).toBeNull();
  });

  it("rejects malformed map when start_scenario references unknown scenario", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        schemaVersion: 3,
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
        map: {
          defaultRegionId: "FREIBURG_1905",
          regions: [
            {
              id: "FREIBURG_1905",
              name: "Freiburg",
              geoCenterLat: 47.9959,
              geoCenterLng: 7.8522,
              zoom: 14.2,
            },
          ],
          points: [
            {
              id: "loc_hbf",
              title: "Hauptbahnhof",
              regionId: "FREIBURG_1905",
              lat: 47.99,
              lng: 7.84,
              locationId: "loc_hbf",
              bindings: [
                {
                  id: "bind_start_unknown",
                  trigger: "card_primary",
                  label: "Start",
                  priority: 100,
                  intent: "objective",
                  actions: [
                    { type: "start_scenario", scenarioId: "scenario_unknown" },
                  ],
                },
              ],
            },
          ],
        },
      }),
    );

    expect(parsed).toBeNull();
  });

  it("parses schema v4 snapshot with questCatalog", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        schemaVersion: 4,
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
        map: {
          defaultRegionId: "FREIBURG_1905",
          regions: [
            {
              id: "FREIBURG_1905",
              name: "Freiburg",
              geoCenterLat: 47.9959,
              geoCenterLng: 7.8522,
              zoom: 14.2,
            },
          ],
          points: [],
        },
        questCatalog: [
          {
            id: "quest_main",
            title: "Main Case",
            stages: [
              {
                stage: 1,
                title: "Find contact",
                objectiveHint: "Meet the station witness",
                objectivePointIds: ["loc_hbf"],
              },
            ],
          },
        ],
      }),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.questCatalog?.length).toBe(1);
    expect(parsed?.questCatalog?.[0]?.id).toBe("quest_main");
    expect(parsed?.questCatalog?.[0]?.stages[0]?.objectivePointIds).toEqual([
      "loc_hbf",
    ]);
  });

  it("rejects schema v4 snapshot without questCatalog", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        schemaVersion: 4,
        scenarios: [],
        nodes: [],
        mindPalace: {
          cases: [],
          facts: [],
          hypotheses: [],
        },
        map: {
          defaultRegionId: "FREIBURG_1905",
          regions: [
            {
              id: "FREIBURG_1905",
              name: "Freiburg",
              geoCenterLat: 47.9959,
              geoCenterLng: 7.8522,
              zoom: 14.2,
            },
          ],
          points: [],
        },
      }),
    );

    expect(parsed).toBeNull();
  });

  it("rejects questCatalog with duplicate quest stages", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        schemaVersion: 4,
        scenarios: [],
        nodes: [],
        mindPalace: {
          cases: [],
          facts: [],
          hypotheses: [],
        },
        map: {
          defaultRegionId: "FREIBURG_1905",
          regions: [
            {
              id: "FREIBURG_1905",
              name: "Freiburg",
              geoCenterLat: 47.9959,
              geoCenterLng: 7.8522,
              zoom: 14.2,
            },
          ],
          points: [],
        },
        questCatalog: [
          {
            id: "quest_main",
            title: "Main Case",
            stages: [
              { stage: 1, title: "A", objectiveHint: "A" },
              { stage: 1, title: "B", objectiveHint: "B" },
            ],
          },
        ],
      }),
    );

    expect(parsed).toBeNull();
  });
});
