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
      if (table === mocks.tablesMock.contentVersion) {
        return [[{ checksum: "abc", isActive: true }], true];
      }
      if (table === mocks.tablesMock.contentSnapshot) {
        return [[{ checksum: "abc", payloadJson: "{}" }], true];
      }

      return [[], true];
    });
  });

  it("derives state for current player and resolves mapped scenario", () => {
    const { result } = renderHook(() => useMapRuntimeState(testDataSource));
    const point = result.current.points[0];

    expect(result.current.currentLocationId).toBe("loc_freiburg_bank");
    expect(point.state).toBe("visited");
    expect(point.resolvedScenarioId).toBe("sandbox_case01_pilot");
    expect(point.canStartScenario).toBe(true);
    expect(result.current.isReady).toBe(true);
  });

  it("falls back to travel-only when mapped scenario is absent in snapshot", () => {
    mocks.parseSnapshotMock.mockReturnValue({
      schemaVersion: 2,
      scenarios: [{ id: "intro_journalist" }],
      nodes: [],
      mindPalace: { cases: [], facts: [], hypotheses: [] },
    });

    const { result } = renderHook(() => useMapRuntimeState(testDataSource));
    const point = result.current.points[0];

    expect(point.resolvedScenarioId).toBeNull();
    expect(point.canStartScenario).toBe(false);
    expect(point.canTravel).toBe(true);
  });
});
