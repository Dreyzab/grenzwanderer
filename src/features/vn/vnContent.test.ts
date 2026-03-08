import { describe, expect, it } from "vitest";
import {
  MIN_VN_SCHEMA_WITH_MAP,
  MIN_VN_SCHEMA_WITH_MAP_EXPANSIONS,
  MIN_VN_SCHEMA_WITH_MIND_PALACE,
  MIN_VN_SCHEMA_WITH_QUEST_CATALOG,
} from "./snapshotSchema";
import {
  createLegacyMaplessSnapshot,
  createTestSnapshot,
} from "./snapshotTestUtils";
import { parseSnapshot } from "./vnContent";

describe("vnContent runtime parsing", () => {
  it("parses snapshot-level vnRuntime.skillCheckDice", () => {
    const parsed = parseSnapshot(
      JSON.stringify(
        createTestSnapshot({
          schemaVersion: MIN_VN_SCHEMA_WITH_MIND_PALACE,
          vnRuntime: {
            skillCheckDice: "d10",
            defaultEntryScenarioId: "sandbox_case01_pilot",
          },
        }),
      ),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.vnRuntime?.skillCheckDice).toBe("d10");
    expect(parsed?.vnRuntime?.defaultEntryScenarioId).toBe(
      "sandbox_case01_pilot",
    );
  });

  it("parses scenario-level skillCheckDice override", () => {
    const parsed = parseSnapshot(
      JSON.stringify(
        createTestSnapshot({
          schemaVersion: MIN_VN_SCHEMA_WITH_MIND_PALACE,
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
        }),
      ),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.scenarios[0]?.skillCheckDice).toBe("d10");
  });

  it("parses opted-in skill check chance metadata", () => {
    const parsed = parseSnapshot(
      JSON.stringify(
        createTestSnapshot({
          scenarios: [
            {
              id: "scenario_a",
              title: "Scenario A",
              startNodeId: "node_a",
              nodeIds: ["node_a", "node_b"],
            },
          ],
          nodes: [
            {
              id: "node_a",
              scenarioId: "scenario_a",
              title: "Node A",
              body: "Body",
              choices: [
                {
                  id: "choice_a",
                  text: "Probe",
                  nextNodeId: "node_b",
                  skillCheck: {
                    id: "check_probe",
                    voiceId: "attr_social",
                    difficulty: 8,
                    showChancePercent: true,
                  },
                },
              ],
            },
            {
              id: "node_b",
              scenarioId: "scenario_a",
              title: "Node B",
              body: "Body",
              choices: [],
            },
          ],
        }),
      ),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.nodes[0]?.choices[0]?.skillCheck?.showChancePercent).toBe(
      true,
    );
  });

  it("parses open_battle_mode in VN effects and map actions", () => {
    const parsed = parseSnapshot(
      JSON.stringify(
        createTestSnapshot({
          schemaVersion: MIN_VN_SCHEMA_WITH_MAP,
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
              choices: [
                {
                  id: "choice_open_battle",
                  text: "Open duel",
                  nextNodeId: "node_a",
                  effects: [
                    {
                      type: "open_battle_mode",
                      scenarioId: "sandbox_son_duel",
                      returnTab: "vn",
                    },
                  ],
                },
              ],
            },
          ],
          map: {
            defaultRegionId: "FREIBURG_1905",
            regions: [
              {
                id: "FREIBURG_1905",
                name: "Freiburg",
                geoCenterLat: 47.99,
                geoCenterLng: 7.85,
                zoom: 14,
              },
            ],
            points: [
              {
                id: "loc_battle_debug",
                title: "Duel Point",
                regionId: "FREIBURG_1905",
                lat: 47.99,
                lng: 7.85,
                category: "HUB",
                locationId: "loc_battle_debug",
                bindings: [
                  {
                    id: "bind_open_duel",
                    trigger: "card_secondary",
                    label: "Open duel",
                    priority: 50,
                    intent: "interaction",
                    actions: [
                      {
                        type: "open_battle_mode",
                        scenarioId: "sandbox_son_duel",
                        returnTab: "map",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        }),
      ),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.nodes[0]?.choices[0]?.effects?.[0]).toEqual({
      type: "open_battle_mode",
      scenarioId: "sandbox_son_duel",
      returnTab: "vn",
    });
    expect(parsed?.map?.points[0]?.bindings[0]?.actions[0]).toEqual({
      type: "open_battle_mode",
      scenarioId: "sandbox_son_duel",
      returnTab: "map",
    });
  });

  it("rejects malformed open_battle_mode payloads", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        ...createTestSnapshot({
          schemaVersion: MIN_VN_SCHEMA_WITH_MAP,
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
              choices: [
                {
                  id: "choice_open_battle",
                  text: "Open duel",
                  nextNodeId: "node_a",
                  effects: [
                    {
                      type: "open_battle_mode",
                      scenarioId: 7 as unknown as string,
                    },
                  ],
                },
              ],
            },
          ],
        }),
      }),
    );

    expect(parsed).toBeNull();
  });

  it("rejects malformed map open_battle_mode actions", () => {
    const parsed = parseSnapshot(
      JSON.stringify(
        createTestSnapshot({
          schemaVersion: MIN_VN_SCHEMA_WITH_MAP,
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
          map: {
            defaultRegionId: "FREIBURG_1905",
            regions: [
              {
                id: "FREIBURG_1905",
                name: "Freiburg",
                geoCenterLat: 47.99,
                geoCenterLng: 7.85,
                zoom: 14,
              },
            ],
            points: [
              {
                id: "loc_battle_debug",
                title: "Duel Point",
                regionId: "FREIBURG_1905",
                lat: 47.99,
                lng: 7.85,
                category: "HUB",
                locationId: "loc_battle_debug",
                bindings: [
                  {
                    id: "bind_open_duel",
                    trigger: "card_secondary",
                    label: "Open duel",
                    priority: 50,
                    intent: "interaction",
                    actions: [
                      {
                        type: "open_battle_mode",
                        scenarioId: "sandbox_son_duel",
                        returnTab: 1 as unknown as "map" | "vn",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        }),
      ),
    );

    expect(parsed).toBeNull();
  });

  it("rejects malformed skill check chance metadata", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        ...createTestSnapshot({
          scenarios: [
            {
              id: "scenario_a",
              title: "Scenario A",
              startNodeId: "node_a",
              nodeIds: ["node_a", "node_b"],
            },
          ],
          nodes: [
            {
              id: "node_a",
              scenarioId: "scenario_a",
              title: "Node A",
              body: "Body",
              choices: [
                {
                  id: "choice_a",
                  text: "Probe",
                  nextNodeId: "node_b",
                  skillCheck: {
                    id: "check_probe",
                    voiceId: "attr_social",
                    difficulty: 8,
                    showChancePercent: "yes" as unknown as boolean,
                  },
                },
              ],
            },
            {
              id: "node_b",
              scenarioId: "scenario_a",
              title: "Node B",
              body: "Body",
              choices: [],
            },
          ],
        }),
      }),
    );

    expect(parsed).toBeNull();
  });

  it("keeps backward compatibility for snapshots without vnRuntime", () => {
    const parsed = parseSnapshot(
      JSON.stringify(
        createTestSnapshot({
          schemaVersion: MIN_VN_SCHEMA_WITH_MIND_PALACE,
          vnRuntime: undefined,
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
        }),
      ),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.vnRuntime).toBeUndefined();
  });

  it("parses schema v3 snapshot with map block and legacy category fallback", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        ...createTestSnapshot({
          schemaVersion: MIN_VN_SCHEMA_WITH_MAP,
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
          questCatalog: undefined,
        }),
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
    expect(parsed?.map?.points[0]?.category).toBe("PUBLIC");
  });

  it("rejects schema v3 snapshot without map block", () => {
    const parsed = parseSnapshot(
      JSON.stringify(
        createTestSnapshot({
          schemaVersion: MIN_VN_SCHEMA_WITH_MAP,
          map: undefined,
        }),
      ),
    );

    expect(parsed).toBeNull();
  });

  it("rejects malformed map when start_scenario references unknown scenario", () => {
    const parsed = parseSnapshot(
      JSON.stringify(
        createTestSnapshot({
          schemaVersion: MIN_VN_SCHEMA_WITH_MAP,
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
                category: "PUBLIC",
                locationId: "loc_hbf",
                bindings: [
                  {
                    id: "bind_start_unknown",
                    trigger: "card_primary",
                    label: "Start",
                    priority: 100,
                    intent: "objective",
                    actions: [
                      {
                        type: "start_scenario",
                        scenarioId: "scenario_unknown",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          questCatalog: undefined,
        }),
      ),
    );

    expect(parsed).toBeNull();
  });

  it("parses schema v4 snapshot with questCatalog", () => {
    const parsed = parseSnapshot(
      JSON.stringify(
        createTestSnapshot({
          schemaVersion: MIN_VN_SCHEMA_WITH_QUEST_CATALOG,
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
      ),
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
      JSON.stringify(
        createTestSnapshot({
          schemaVersion: MIN_VN_SCHEMA_WITH_QUEST_CATALOG,
          questCatalog: undefined,
        }),
      ),
    );

    expect(parsed).toBeNull();
  });

  it("rejects questCatalog with duplicate quest stages", () => {
    const parsed = parseSnapshot(
      JSON.stringify(
        createTestSnapshot({
          schemaVersion: MIN_VN_SCHEMA_WITH_QUEST_CATALOG,
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
      ),
    );

    expect(parsed).toBeNull();
  });

  it("parses schema v6 map expansions", () => {
    const parsed = parseSnapshot(
      JSON.stringify(
        createTestSnapshot({
          schemaVersion: MIN_VN_SCHEMA_WITH_MAP_EXPANSIONS,
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
                id: "loc_agency",
                title: "Agency",
                regionId: "FREIBURG_1905",
                lat: 47.99,
                lng: 7.85,
                category: "HUB",
                locationId: "loc_agency",
                bindings: [],
              },
              {
                id: "loc_munster",
                title: "Munster",
                regionId: "FREIBURG_1905",
                lat: 47.996,
                lng: 7.852,
                category: "SHADOW",
                locationId: "loc_munster",
                bindings: [],
              },
            ],
            shadowRoutes: [
              {
                id: "route_shadow_munster",
                regionId: "FREIBURG_1905",
                pointIds: ["loc_agency", "loc_munster"],
                color: "#112233",
                revealFlagsAll: ["agency_briefing_complete"],
              },
            ],
            qrCodeRegistry: [
              {
                codeId: "qr_munster_gate",
                codeHash:
                  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                redeemPolicy: "once_per_player",
                effects: [
                  { type: "unlock_group", groupId: "shadow_munster" },
                  { type: "spawn_map_event", templateId: "evt_whisper" },
                ],
                requiresFlagsAll: ["agency_briefing_complete"],
              },
            ],
            mapEventTemplates: [
              {
                id: "evt_whisper",
                ttlMinutes: 15,
                point: {
                  id: "evt_whisper_pin",
                  title: "Whisper",
                  regionId: "FREIBURG_1905",
                  lat: 47.997,
                  lng: 7.853,
                  category: "EPHEMERAL",
                  locationId: "loc_street_event",
                  bindings: [
                    {
                      id: "evt_whisper_start",
                      trigger: "map_pin",
                      label: "Investigate",
                      priority: 10,
                      intent: "interaction",
                      actions: [
                        { type: "start_scenario", scenarioId: "scenario_a" },
                      ],
                    },
                  ],
                },
              },
            ],
            testDefaults: {
              defaultEventTtlMinutes: 0.02,
            },
          },
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
        }),
      ),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.map?.shadowRoutes?.[0]?.id).toBe("route_shadow_munster");
    expect(parsed?.map?.qrCodeRegistry?.[0]?.codeId).toBe("qr_munster_gate");
    expect(parsed?.map?.mapEventTemplates?.[0]?.point.category).toBe(
      "EPHEMERAL",
    );
    expect(parsed?.map?.testDefaults?.defaultEventTtlMinutes).toBe(0.02);
  });

  it("parses mystic snapshot blocks, effects, and map metadata", () => {
    const parsed = parseSnapshot(
      JSON.stringify(
        createTestSnapshot({
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
              choices: [
                {
                  id: "choice_awaken",
                  text: "Read the distortion",
                  nextNodeId: "node_a",
                  effects: [
                    { type: "shift_awakening", amount: 8, exposureDelta: 1 },
                    {
                      type: "record_entity_observation",
                      observationId: "obs_rail_cold",
                      entityArchetypeId: "echo_hound",
                      signatureIds: ["cold"],
                    },
                    { type: "set_sight_mode", mode: "sensitive" },
                    { type: "apply_rationalist_buffer", amount: 3 },
                    { type: "tag_entity_signature", signatureId: "cold" },
                    {
                      type: "unlock_distortion_point",
                      pointId: "loc_hidden_platform",
                    },
                  ],
                },
              ],
            },
          ],
          mysticism: {
            entityArchetypes: [
              {
                id: "echo_hound",
                label: "Echo Hound",
                veilLevel: 2,
                signatures: ["cold"],
                habitats: ["rail"],
                temperament: "tracking",
                witnessValue: 2,
                rationalCoverStories: ["stray dog"],
                allowedManifestations: ["trace"],
              },
            ],
            observations: [
              {
                id: "obs_rail_cold",
                kind: "trace",
                title: "Cold Rails",
                text: "The rail keeps a winter sheen after midnight.",
                entityArchetypeId: "echo_hound",
                signatureIds: ["cold"],
                rationalInterpretation: "Metal fatigue or weather inversion.",
              },
            ],
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
                id: "loc_hidden_platform",
                title: "Hidden Platform",
                regionId: "FREIBURG_1905",
                lat: 47.99,
                lng: 7.84,
                category: "SHADOW",
                locationId: "loc_hidden_platform",
                visibilityModes: ["sensitive"],
                distortionWindow: {
                  minAwakening: 20,
                  maxAwakening: 80,
                },
                revealConditions: [
                  {
                    type: "flag_is",
                    key: "mystic_distortion_loc_hidden_platform",
                    value: true,
                  },
                ],
                entitySignature: "cold",
                rumorHookId: "rumor_hidden_platform",
                bindings: [],
              },
            ],
          },
        }),
      ),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.mysticism?.entityArchetypes[0]?.id).toBe("echo_hound");
    expect(parsed?.nodes[0]?.choices[0]?.effects?.[0]).toEqual({
      type: "shift_awakening",
      amount: 8,
      exposureDelta: 1,
    });
    expect(parsed?.map?.points[0]?.visibilityModes).toEqual(["sensitive"]);
    expect(parsed?.map?.points[0]?.entitySignature).toBe("cold");
  });

  it("rejects schema v6 points without category", () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        ...createTestSnapshot({
          schemaVersion: MIN_VN_SCHEMA_WITH_MAP_EXPANSIONS,
        }),
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
              id: "loc_agency",
              title: "Agency",
              regionId: "FREIBURG_1905",
              lat: 47.99,
              lng: 7.85,
              locationId: "loc_agency",
              bindings: [],
            },
          ],
        },
      }),
    );

    expect(parsed).toBeNull();
  });

  it("keeps parsing legacy mapless snapshots below schema v3", () => {
    const parsed = parseSnapshot(
      JSON.stringify(
        createLegacyMaplessSnapshot({
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
        }),
      ),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.map).toBeUndefined();
  });
});
