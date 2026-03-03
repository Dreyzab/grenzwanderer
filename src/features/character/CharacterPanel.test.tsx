import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CharacterPanel } from "./CharacterPanel";

const mocks = vi.hoisted(() => ({
  useTableMock: vi.fn(),
  useIdentityMock: vi.fn(),
  parseSnapshotMock: vi.fn(),
  usePlayerFlagsMock: vi.fn(),
  usePlayerVarsMock: vi.fn(),
  debugEnabled: false,
  tablesMock: {
    playerQuest: Symbol("playerQuest"),
    contentVersion: Symbol("contentVersion"),
    contentSnapshot: Symbol("contentSnapshot"),
  },
}));

vi.mock("spacetimedb/react", () => ({
  useTable: (...args: unknown[]) => mocks.useTableMock(...args),
}));

vi.mock("../../shared/spacetime/useIdentity", () => ({
  useIdentity: () => mocks.useIdentityMock(),
}));

vi.mock("../../shared/spacetime/bindings", () => ({
  tables: mocks.tablesMock,
}));

vi.mock("../vn/vnContent", () => ({
  parseSnapshot: (...args: unknown[]) => mocks.parseSnapshotMock(...args),
}));

vi.mock("../../entities/player/hooks/usePlayerFlags", () => ({
  usePlayerFlags: () => mocks.usePlayerFlagsMock(),
}));

vi.mock("../../entities/player/hooks/usePlayerVars", () => ({
  usePlayerVars: () => mocks.usePlayerVarsMock(),
}));

vi.mock("../../config", () => ({
  get ENABLE_DEBUG_CONTENT_SEED() {
    return mocks.debugEnabled;
  },
}));

const makeIdentity = (hex: string) => ({
  toHexString: () => hex,
});

describe("CharacterPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.debugEnabled = false;
    mocks.useIdentityMock.mockReturnValue({ identityHex: "me" });
    mocks.usePlayerFlagsMock.mockReturnValue({});
    mocks.usePlayerVarsMock.mockReturnValue({
      attr_intellect: 3,
      attr_social: 2,
    });

    mocks.parseSnapshotMock.mockReturnValue({
      schemaVersion: 4,
      scenarios: [],
      nodes: [],
      map: {
        defaultRegionId: "FREIBURG_1905",
        regions: [],
        points: [
          {
            id: "loc_freiburg_bank",
            title: "Bankhaus J.A. Krebs",
            regionId: "FREIBURG_1905",
            lat: 47.99,
            lng: 7.85,
            locationId: "loc_freiburg_bank",
            bindings: [],
          },
        ],
      },
      questCatalog: [
        {
          id: "quest_banker",
          title: "Bank Case",
          stages: [
            {
              stage: 1,
              title: "Inspect the bank",
              objectiveHint: "Visit the crime scene",
              objectivePointIds: ["loc_freiburg_bank"],
            },
          ],
        },
      ],
    });

    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.playerQuest) {
        return [
          [{ playerId: makeIdentity("me"), questId: "quest_banker", stage: 1 }],
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

  it("hides debug blocks in production mode and renders objective titles", () => {
    render(<CharacterPanel />);

    expect(screen.queryByText("Raw Flags")).not.toBeInTheDocument();
    expect(screen.queryByText("Raw Vars")).not.toBeInTheDocument();
    expect(screen.getByText("Bankhaus J.A. Krebs")).toBeInTheDocument();
    expect(screen.queryByText("loc_freiburg_bank")).not.toBeInTheDocument();
  });

  it("shows debug blocks when debug content seed flag is enabled", () => {
    mocks.debugEnabled = true;

    render(<CharacterPanel />);

    expect(screen.getByText("Raw Flags")).toBeInTheDocument();
    expect(screen.getByText("Raw Vars")).toBeInTheDocument();
  });
});
