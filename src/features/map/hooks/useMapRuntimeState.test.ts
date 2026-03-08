import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MapDataSource } from "../types";
import { useMapRuntimeState } from "./useMapRuntimeState";

const mocks = vi.hoisted(() => ({
  useTableMock: vi.fn(),
  useIdentityMock: vi.fn(),
  parseSnapshotMock: vi.fn(),
  tablesMock: {
    playerLocation: Symbol("playerLocation"),
    playerFlag: Symbol("playerFlag"),
    playerUnlockGroup: Symbol("playerUnlockGroup"),
    playerVar: Symbol("playerVar"),
    playerInventory: Symbol("playerInventory"),
    playerEvidence: Symbol("playerEvidence"),
    playerQuest: Symbol("playerQuest"),
    playerRelationship: Symbol("playerRelationship"),
    playerMapEvent: Symbol("playerMapEvent"),
    contentVersion: Symbol("contentVersion"),
    contentSnapshot: Symbol("contentSnapshot"),
  },
}));

vi.mock("spacetimedb/react", () => ({
  useTable: (...args: unknown[]) => mocks.useTableMock(...args),
}));

vi.mock("../../../shared/spacetime/useIdentity", () => ({
  useIdentity: () => mocks.useIdentityMock(),
}));

vi.mock("../../../shared/spacetime/bindings", () => ({
  tables: mocks.tablesMock,
}));

vi.mock("../../vn/vnContent", () => ({
  parseSnapshot: (...args: unknown[]) => mocks.parseSnapshotMock(...args),
}));

const makeIdentity = (hex: string) => ({
  toHexString: () => hex,
});

const testDataSource: MapDataSource = {
  getRegions: () => [
    {
      id: "FREIBURG_1905",
      name: "Freiburg",
      geoCenterLat: 47.99,
      geoCenterLng: 7.85,
      zoom: 14,
    },
  ],
  getPoints: () => [
    {
      id: "loc_freiburg_bank",
      regionId: "FREIBURG_1905",
      title: "Bank",
      lat: 47.99,
      lng: 7.85,
      locationId: "loc_freiburg_bank",
      unlockGroup: "loc_freiburg_bank",
      legacyScenarioIds: ["detective_case1_bank_scene"],
    },
  ],
  getDefaultRegionId: () => "FREIBURG_1905",
};

describe("useMapRuntimeState", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useIdentityMock.mockReturnValue({ identityHex: "me" });
    mocks.parseSnapshotMock.mockReturnValue({
      schemaVersion: 2,
      scenarios: [{ id: "sandbox_case01_pilot" }],
      nodes: [],
      mindPalace: { cases: [], facts: [], hypotheses: [] },
    });

    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.playerLocation) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              locationId: "loc_freiburg_bank",
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerFlag) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              key: "VISITED_loc_freiburg_bank",
              value: true,
            },
            {
              playerId: makeIdentity("me"),
              key: "agency_briefing_complete",
              value: true,
            },
            {
              playerId: makeIdentity("other"),
              key: "VISITED_loc_other",
              value: true,
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerUnlockGroup) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              groupId: "loc_freiburg_bank",
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerVar) {
        return [
          [{ playerId: makeIdentity("me"), key: "progress", floatValue: 2 }],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerInventory) {
        return [
          [{ playerId: makeIdentity("me"), itemId: "item_a", quantity: 1 }],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerEvidence) {
        return [[{ playerId: makeIdentity("me"), evidenceId: "ev_a" }], true];
      }
      if (table === mocks.tablesMock.playerQuest) {
        return [
          [{ playerId: makeIdentity("me"), questId: "quest_banker", stage: 1 }],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerRelationship) {
        return [
          [{ playerId: makeIdentity("me"), characterId: "npc", value: 1 }],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerMapEvent) {
        return [[], true];
      }
      if (table === mocks.tablesMock.contentVersion) {
        return [[{ checksum: "abc", isActive: true }], true];
      }
      if (table === mocks.tablesMock.contentSnapshot) {
        return [[{ checksum: "abc", payloadJson: "{}" }], true];
      }

      return [[], true];
    });
  });

  it("uses legacy v2 fallback and resolves mapped scenario", () => {
    const { result } = renderHook(() => useMapRuntimeState(testDataSource));
    const point = result.current.points[0];

    expect(result.current.source).toBe("legacy_v2");
    expect(result.current.currentLocationId).toBe("loc_freiburg_bank");
    expect(point?.state).toBe("visited");
    expect(point?.resolvedScenarioId).toBe("sandbox_case01_pilot");
    expect(point?.canStartScenario).toBe(true);
    expect(point?.primaryBinding?.id).toBe("legacy_start_loc_freiburg_bank");
    expect(result.current.isReady).toBe(true);
  });

  it("uses snapshot v3 map bindings and marks objective state", () => {
    mocks.parseSnapshotMock.mockReturnValue({
      schemaVersion: 3,
      scenarios: [{ id: "sandbox_case01_pilot" }],
      nodes: [],
      mindPalace: { cases: [], facts: [], hypotheses: [] },
      questCatalog: [
        {
          id: "quest_banker",
          title: "Bank Case",
          stages: [
            {
              stage: 1,
              title: "Visit bank",
              objectiveHint: "Meet the banker",
              objectivePointIds: ["loc_freiburg_bank"],
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
            id: "loc_freiburg_bank",
            regionId: "FREIBURG_1905",
            title: "Bank",
            lat: 47.99,
            lng: 7.85,
            locationId: "loc_freiburg_bank",
            category: "PUBLIC",
            bindings: [
              {
                id: "bind_start",
                trigger: "card_primary",
                label: "Investigate",
                priority: 100,
                intent: "interaction",
                conditions: [
                  {
                    type: "flag_is",
                    key: "VISITED_loc_freiburg_bank",
                    value: true,
                  },
                ],
                actions: [
                  {
                    type: "start_scenario",
                    scenarioId: "sandbox_case01_pilot",
                  },
                ],
              },
              {
                id: "sys_travel_loc_freiburg_bank",
                trigger: "card_secondary",
                label: "Travel",
                priority: 10,
                intent: "travel",
                actions: [
                  { type: "travel_to", locationId: "loc_freiburg_bank" },
                ],
              },
            ],
          },
        ],
      },
    });

    const { result } = renderHook(() => useMapRuntimeState(testDataSource));
    const point = result.current.points[0];

    expect(result.current.source).toBe("snapshot_v3");
    expect(point?.availableBindings.map((entry) => entry.id)).toEqual([
      "bind_start",
      "sys_travel_loc_freiburg_bank",
    ]);
    expect(point?.isObjectiveActive).toBe(true);
    expect(point?.primaryBinding?.label).toBe("Investigate");
    expect(point?.travelBinding?.id).toBe("sys_travel_loc_freiburg_bank");
    expect(point?.resolvedScenarioId).toBe("sandbox_case01_pilot");
  });

  it("hides hidden initial points while they remain locked", () => {
    mocks.parseSnapshotMock.mockReturnValue({
      schemaVersion: 3,
      scenarios: [{ id: "sandbox_case01_pilot" }],
      nodes: [],
      mindPalace: { cases: [], facts: [], hypotheses: [] },
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
            id: "loc_shadow",
            regionId: "FREIBURG_1905",
            title: "Shadow Point",
            lat: 47.98,
            lng: 7.84,
            locationId: "loc_shadow",
            category: "SHADOW",
            defaultState: "locked",
            isHiddenInitially: true,
            bindings: [],
          },
        ],
      },
    });

    const { result } = renderHook(() => useMapRuntimeState(testDataSource));

    expect(result.current.source).toBe("snapshot_v3");
    expect(result.current.points).toHaveLength(0);
  });

  it("shows only the agency hub before the first briefing", () => {
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.playerLocation) {
        return [
          [{ playerId: makeIdentity("me"), locationId: "loc_agency" }],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerFlag) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerUnlockGroup) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerVar) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerInventory) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerEvidence) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerQuest) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerRelationship) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerMapEvent) {
        return [[], true];
      }
      if (table === mocks.tablesMock.contentVersion) {
        return [[{ checksum: "abc", isActive: true }], true];
      }
      if (table === mocks.tablesMock.contentSnapshot) {
        return [[{ checksum: "abc", payloadJson: "{}" }], true];
      }

      return [[], true];
    });

    mocks.parseSnapshotMock.mockReturnValue({
      schemaVersion: 6,
      scenarios: [],
      nodes: [],
      mindPalace: { cases: [], facts: [], hypotheses: [] },
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
            id: "loc_agency",
            regionId: "FREIBURG_1905",
            title: "Agency",
            lat: 47.99,
            lng: 7.85,
            locationId: "loc_agency",
            category: "HUB",
            bindings: [],
          },
          {
            id: "loc_hbf",
            regionId: "FREIBURG_1905",
            title: "Station",
            lat: 47.98,
            lng: 7.84,
            locationId: "loc_hbf",
            category: "PUBLIC",
            bindings: [],
          },
        ],
      },
    });

    const { result } = renderHook(() => useMapRuntimeState(testDataSource));

    expect(result.current.points.map((point) => point.id)).toEqual([
      "loc_agency",
    ]);
  });

  it("injects the agency command desk binding after briefing completion", () => {
    mocks.parseSnapshotMock.mockReturnValue({
      schemaVersion: 6,
      scenarios: [],
      nodes: [],
      mindPalace: { cases: [], facts: [], hypotheses: [] },
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
            id: "loc_agency",
            regionId: "FREIBURG_1905",
            title: "Agency",
            lat: 47.99,
            lng: 7.85,
            locationId: "loc_agency",
            category: "HUB",
            bindings: [],
          },
        ],
      },
    });

    const { result } = renderHook(() => useMapRuntimeState(testDataSource));
    const agency = result.current.points[0];
    const commandBinding = agency?.availableBindings.find(
      (binding) => binding.id === "agency_command_desk",
    );

    expect(commandBinding).toBeDefined();
    expect(commandBinding?.actions[0]).toEqual({
      type: "open_command_mode",
      scenarioId: "agency_evening_briefing",
      returnTab: "map",
    });
  });

  it("gates distortion points behind sight mode and awakening thresholds", () => {
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.playerLocation) {
        return [
          [{ playerId: makeIdentity("me"), locationId: "loc_agency" }],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerFlag) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              key: "agency_briefing_complete",
              value: true,
            },
            {
              playerId: makeIdentity("me"),
              key: "mystic_distortion_loc_hidden_platform",
              value: true,
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerVar) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              key: "mystic_awakening",
              floatValue: 42,
            },
            {
              playerId: makeIdentity("me"),
              key: "mystic_sight_mode_tier",
              floatValue: 1,
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerUnlockGroup) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerInventory) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerEvidence) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerQuest) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerRelationship) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerMapEvent) {
        return [[], true];
      }
      if (table === mocks.tablesMock.contentVersion) {
        return [[{ checksum: "abc", isActive: true }], true];
      }
      if (table === mocks.tablesMock.contentSnapshot) {
        return [[{ checksum: "abc", payloadJson: "{}" }], true];
      }

      return [[], true];
    });

    mocks.parseSnapshotMock.mockReturnValue({
      schemaVersion: 6,
      scenarios: [],
      nodes: [],
      mindPalace: { cases: [], facts: [], hypotheses: [] },
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
            id: "loc_hidden_platform",
            regionId: "FREIBURG_1905",
            title: "Hidden Platform",
            lat: 47.98,
            lng: 7.84,
            locationId: "loc_hidden_platform",
            category: "SHADOW",
            visibilityModes: ["sensitive"],
            distortionWindow: {
              minAwakening: 25,
              maxAwakening: 60,
            },
            revealConditions: [
              {
                type: "flag_is",
                key: "mystic_distortion_loc_hidden_platform",
                value: true,
              },
            ],
            entitySignature: "cold",
            bindings: [],
          },
        ],
      },
    });

    const { result } = renderHook(() => useMapRuntimeState(testDataSource));

    expect(result.current.points.map((point) => point.id)).toEqual([
      "loc_hidden_platform",
    ]);
    expect(result.current.points[0]?.entitySignature).toBe("cold");
  });

  it("merges active ephemeral events into the runtime point list", () => {
    const futureMicros = BigInt(Date.now() + 60_000) * 1000n;

    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.playerLocation) {
        return [
          [{ playerId: makeIdentity("me"), locationId: "loc_agency" }],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerFlag) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              key: "agency_briefing_complete",
              value: true,
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerUnlockGroup) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerVar) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerInventory) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerEvidence) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerQuest) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerRelationship) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerMapEvent) {
        return [
          [
            {
              eventId: "me::event::evt_workers_pub_raid",
              playerId: makeIdentity("me"),
              templateId: "evt_workers_pub_raid",
              snapshotChecksum: "abc",
              payloadJson: JSON.stringify({
                point: {
                  id: "evt_workers_pub_raid_pin",
                  title: "Street Raid Lead",
                  regionId: "FREIBURG_1905",
                  lat: 47.9972,
                  lng: 7.8456,
                  category: "EPHEMERAL",
                  locationId: "loc_street_event",
                  bindings: [
                    {
                      id: "bind_evt_workers_pub_raid_start",
                      trigger: "map_pin",
                      label: "Investigate",
                      priority: 100,
                      intent: "interaction",
                      actions: [
                        {
                          type: "start_scenario",
                          scenarioId: "sandbox_workers_pub_rumor",
                        },
                      ],
                    },
                  ],
                },
              }),
              sourceLocationId: "loc_workers_pub",
              status: "active",
              expiresAt: { microsSinceUnixEpoch: futureMicros },
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.contentVersion) {
        return [[{ checksum: "abc", isActive: true }], true];
      }
      if (table === mocks.tablesMock.contentSnapshot) {
        return [[{ checksum: "abc", payloadJson: "{}" }], true];
      }

      return [[], true];
    });

    mocks.parseSnapshotMock.mockReturnValue({
      schemaVersion: 6,
      scenarios: [{ id: "sandbox_workers_pub_rumor" }],
      nodes: [],
      mindPalace: { cases: [], facts: [], hypotheses: [] },
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
            id: "loc_agency",
            regionId: "FREIBURG_1905",
            title: "Agency",
            lat: 47.99,
            lng: 7.85,
            locationId: "loc_agency",
            category: "HUB",
            bindings: [],
          },
        ],
        mapEventTemplates: [],
      },
    });

    const { result } = renderHook(() => useMapRuntimeState(testDataSource));
    const eventPoint = result.current.points.find((point) => point.eventId);

    expect(eventPoint?.id).toBe("me::event::evt_workers_pub_raid");
    expect(eventPoint?.category).toBe("EPHEMERAL");
    expect(eventPoint?.runtimeSource).toBe("ephemeral");
    expect(eventPoint?.resolvedScenarioId).toBe("sandbox_workers_pub_rumor");
  });
});
