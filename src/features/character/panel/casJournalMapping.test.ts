import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCharacterPanelViewModel } from "./useCharacterPanelViewModel";
import { CASE_CATALOG } from "../../../shared/vn-contract";

// Mocks configuration matching useCharacterPanelViewModel dependencies
const mocks = vi.hoisted(() => ({
  useTableMock: vi.fn(),
  useIdentityMock: vi.fn(),
  parseSnapshotMock: vi.fn(),
  usePlayerFlagsMock: vi.fn(),
  usePlayerVarsMock: vi.fn(),
  tablesMock: {
    myPlayerProfile: Symbol("myPlayerProfile"),
    myQuests: Symbol("myQuests"),
    myNpcState: Symbol("myNpcState"),
    myNpcFavors: Symbol("myNpcFavors"),
    myFactionSignals: Symbol("myFactionSignals"),
    myAgencyCareer: Symbol("myAgencyCareer"),
    contentVersion: Symbol("contentVersion"),
    contentSnapshot: Symbol("contentSnapshot"),
    myQuestInstances: Symbol("myQuestInstances"),
  },
}));

vi.mock("spacetimedb/react", () => ({
  useTable: (table: symbol) => mocks.useTableMock(table),
  useReducer: () => vi.fn(),
}));

vi.mock("../../../shared/spacetime/useIdentity", () => ({
  useIdentity: () => mocks.useIdentityMock(),
}));

vi.mock("../../../shared/spacetime/bindings", () => ({
  tables: mocks.tablesMock,
  reducers: {
    startScenario: Symbol("startScenario"),
  },
}));

vi.mock("../../vn/vnContent", () => ({
  parseSnapshot: (...args: unknown[]) => mocks.parseSnapshotMock(...args),
}));

vi.mock("../../../entities/player/hooks/usePlayerFlags", () => ({
  usePlayerFlags: () => mocks.usePlayerFlagsMock(),
}));

vi.mock("../../../entities/player/hooks/usePlayerVars", () => ({
  usePlayerVars: () => mocks.usePlayerVarsMock(),
}));

vi.mock("../../../entities/player/hooks/usePlayerBindings", () => ({
  usePlayerBindings: () => {
    const [quests] = mocks.useTableMock(mocks.tablesMock.myQuests);
    const [npcState] = mocks.useTableMock(mocks.tablesMock.myNpcState);
    const [npcFavors] = mocks.useTableMock(mocks.tablesMock.myNpcFavors);
    const [factionSignals] = mocks.useTableMock(
      mocks.tablesMock.myFactionSignals,
    );
    const [agencyCareer] = mocks.useTableMock(mocks.tablesMock.myAgencyCareer);
    const [profiles] = mocks.useTableMock(mocks.tablesMock.myPlayerProfile);

    return {
      identityHex: "me",
      flags: mocks.usePlayerFlagsMock(),
      vars: mocks.usePlayerVarsMock(),
      quests,
      npcState,
      npcFavors,
      factionSignals,
      agencyCareer: agencyCareer[0] || null,
      rows: {
        profiles,
        agencyCareer,
      },
    };
  },
}));

const mockSnapshot = {
  map: {
    points: [
      { id: "loc_freiburg_rail", title: "Freiburg Rail Yard" },
      { id: "loc_rathaus", title: "Mayor's Office" },
    ],
  },
  questCatalog: [
    {
      id: "quest_banker",
      title: "Bank Case",
      stages: [
        {
          stage: 1,
          title: "Surveying",
          objectiveHint: "Search the vaults",
          objectivePointIds: ["loc_freiburg_rail"],
        },
      ],
    },
  ],
  socialCatalog: {
    npcIdentities: [],
    services: [],
  },
  mysticism: {
    entityArchetypes: [],
    observations: [],
  },
};

describe("CAS MVP-2 Integrated Journal Mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useIdentityMock.mockReturnValue({ identityHex: "me" });
    mocks.usePlayerFlagsMock.mockReturnValue({});
    mocks.usePlayerVarsMock.mockReturnValue({});
    mocks.parseSnapshotMock.mockReturnValue(mockSnapshot);

    // Default implementations for useTableMock
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.contentVersion) {
        return [[{ checksum: "abc", isActive: true }], true];
      }
      if (table === mocks.tablesMock.contentSnapshot) {
        return [[{ checksum: "abc", payloadJson: "{}" }], true];
      }
      if (table === mocks.tablesMock.myQuestInstances) {
        return [[], true];
      }
      if (table === mocks.tablesMock.myQuests) {
        return [[], true];
      }
      return [[], true];
    });
  });

  it("correctly maps canon quests with default 'Not started' status", () => {
    const { result } = renderHook(() => useCharacterPanelViewModel());
    const { questJournalEntries } = result.current;

    const canonEntry = questJournalEntries.find((q) => q.kind === "canon");
    expect(canonEntry).toBeDefined();
    expect(canonEntry?.title).toBe("Bank Case");
    expect(canonEntry?.status).toBe("Not started");
    expect(canonEntry?.currentStage).toBe(1);
  });

  it("correctly maps CAS procedural quest instances into union entry structure", () => {
    const mockProceduralRow = {
      instanceId: "inst_test_01",
      kind: "generated_side_case",
      archetypeId: "archetype_hound",
      stateNamespace: "test_ns_01",
      stepsJson: JSON.stringify([
        { id: "step_01", nodeId: "loc_freiburg_rail", status: "completed" },
        { id: "step_02", nodeId: "loc_rathaus", status: "active" },
      ]),
      eligibilitySnapshotJson: JSON.stringify({
        triggerRuleId: "rule_01",
        eventName: "case.entered",
        scenarioId: "scen_test",
      }),
      status: "in_progress",
      createdAt: 1716300000000n, // BigInt representation
    };

    // Return custom mock row when requesting quest instances
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.contentVersion) {
        return [[{ checksum: "abc", isActive: true }], true];
      }
      if (table === mocks.tablesMock.contentSnapshot) {
        return [[{ checksum: "abc", payloadJson: "{}" }], true];
      }
      if (table === mocks.tablesMock.myQuestInstances) {
        return [[mockProceduralRow], true];
      }
      return [[], true];
    });

    const { result } = renderHook(() => useCharacterPanelViewModel());
    const { questJournalEntries } = result.current;

    // Verify presence
    const procedural = questJournalEntries.find((q) => q.kind === "procedural");
    expect(procedural).toBeDefined();

    if (procedural && procedural.kind === "procedural") {
      expect(procedural.id).toBe("inst_test_01");
      expect(procedural.stateNamespace).toBe("test_ns_01");
      expect(procedural.status).toBe("In progress");
      expect(procedural.createdAt).toBe(1716300000000); // BigInt properly converted to number

      // Eligibility Snapshot Parsing
      expect(procedural.eligibilitySnapshot).toBeDefined();
      expect(procedural.eligibilitySnapshot?.eventName).toBe("case.entered");
      expect(procedural.eligibilitySnapshot?.triggerRuleId).toBe("rule_01");

      // Steps Title Localization Mapping (from mockSnapshot.map.points)
      expect(procedural.steps).toHaveLength(2);
      expect(procedural.steps[0].title).toBe("Freiburg Rail Yard"); // loc_freiburg_rail matched correctly
      expect(procedural.steps[0].status).toBe("completed");
      expect(procedural.steps[1].title).toBe("Mayor's Office"); // loc_rathaus matched correctly
      expect(procedural.steps[1].status).toBe("active");

      // Stage Calculation: step_02 is active at index 1 -> Stage 2
      expect(procedural.currentStage).toBe(2);
    }
  });

  it("handles empty or corrupt JSON gracefully", () => {
    const mockCorruptRow = {
      instanceId: "inst_test_corrupt",
      kind: "generated_side_case",
      archetypeId: "archetype_hound",
      stateNamespace: "test_ns_01",
      stepsJson: "invalid_json_here{]",
      eligibilitySnapshotJson: "invalid_json_here{]",
      status: "completed",
      createdAt: 1716300000000n,
    };

    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.contentVersion) {
        return [[{ checksum: "abc", isActive: true }], true];
      }
      if (table === mocks.tablesMock.contentSnapshot) {
        return [[{ checksum: "abc", payloadJson: "{}" }], true];
      }
      if (table === mocks.tablesMock.myQuestInstances) {
        return [[mockCorruptRow], true];
      }
      return [[], true];
    });

    const { result } = renderHook(() => useCharacterPanelViewModel());
    const { questJournalEntries } = result.current;

    const procedural = questJournalEntries.find((q) => q.kind === "procedural");
    expect(procedural).toBeDefined();

    if (procedural && procedural.kind === "procedural") {
      expect(procedural.steps).toEqual([]);
      expect(procedural.eligibilitySnapshot).toBeUndefined();
      expect(procedural.status).toBe("Completed");
    }
  });
});
