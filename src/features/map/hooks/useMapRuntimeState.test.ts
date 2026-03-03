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
});
