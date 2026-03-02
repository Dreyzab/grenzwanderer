import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VnScreen } from "./VnScreen";

const mocks = vi.hoisted(() => {
  const tables = {
    contentVersion: Symbol("contentVersion"),
    contentSnapshot: Symbol("contentSnapshot"),
    vnSession: Symbol("vnSession"),
    vnSkillCheckResult: Symbol("vnSkillCheckResult"),
  };
  const reducers = {
    startScenario: Symbol("startScenario"),
    recordChoice: Symbol("recordChoice"),
    performSkillCheck: Symbol("performSkillCheck"),
  };

  return {
    tables,
    reducers,
    useTableMock: vi.fn(),
    useReducerMock: vi.fn(),
    startScenarioMock: vi.fn(),
    recordChoiceMock: vi.fn(),
    performSkillCheckMock: vi.fn(),
    useIdentityMock: vi.fn(),
    usePlayerFlagsMock: vi.fn(),
    usePlayerVarsMock: vi.fn(),
  };
});

vi.mock("spacetimedb/react", () => ({
  useTable: (...args: unknown[]) => mocks.useTableMock(...args),
  useReducer: (...args: unknown[]) => mocks.useReducerMock(...args),
}));

vi.mock("../../../shared/spacetime/bindings", () => ({
  tables: mocks.tables,
  reducers: mocks.reducers,
}));

vi.mock("../../../shared/spacetime/useIdentity", () => ({
  useIdentity: () => mocks.useIdentityMock(),
}));

vi.mock("../../../entities/player/hooks/usePlayerFlags", () => ({
  usePlayerFlags: () => mocks.usePlayerFlagsMock(),
}));

vi.mock("../../../entities/player/hooks/usePlayerVars", () => ({
  usePlayerVars: () => mocks.usePlayerVarsMock(),
}));

vi.mock("../../../widgets/vn-overlay/VnNarrativePanel", () => ({
  VnNarrativePanel: ({ choicesSlot, onSurfaceTap }: any) => (
    <div>
      <button type="button" onClick={onSurfaceTap}>
        surface-tap
      </button>
      <div data-testid="choices-slot">{choicesSlot}</div>
    </div>
  ),
}));

vi.mock("./VnSkillCheckToast", () => ({
  VnSkillCheckToast: () => null,
}));

vi.mock("./VnPassiveCheckBanner", () => ({
  VnPassiveCheckBanner: () => null,
}));

const identity = (hex: string) => ({
  toHexString: () => hex,
});

const timestamp = (micros: bigint) => ({
  microsSinceUnixEpoch: micros,
});

type TestState = {
  contentVersionRows: any[];
  contentVersionReady: boolean;
  contentSnapshotRows: any[];
  contentSnapshotReady: boolean;
  sessionRows: any[];
  sessionReady: boolean;
  skillResultRows: any[];
};

const makeSnapshotPayload = (scenarios: unknown[], nodes: unknown[]): string =>
  JSON.stringify({
    schemaVersion: 2,
    scenarios,
    nodes,
    vnRuntime: {
      skillCheckDice: "d20",
      defaultEntryScenarioId: "sandbox_case01_pilot",
    },
    mindPalace: {
      cases: [],
      facts: [],
      hypotheses: [],
    },
  });

describe("VnScreen critical behavior", () => {
  let state: TestState;

  beforeEach(() => {
    vi.clearAllMocks();

    state = {
      contentVersionRows: [
        {
          version: "v1",
          checksum: "checksum_v1",
          schemaVersion: 2,
          publishedAt: timestamp(1n),
          isActive: true,
        },
      ],
      contentVersionReady: true,
      contentSnapshotRows: [],
      contentSnapshotReady: true,
      sessionRows: [],
      sessionReady: true,
      skillResultRows: [],
    };

    mocks.useIdentityMock.mockReturnValue({
      identityHex: "me",
      identity: identity("me"),
    });
    mocks.usePlayerFlagsMock.mockReturnValue({});
    mocks.usePlayerVarsMock.mockReturnValue({});

    mocks.startScenarioMock.mockResolvedValue(undefined);
    mocks.recordChoiceMock.mockResolvedValue(undefined);
    mocks.performSkillCheckMock.mockResolvedValue(undefined);

    mocks.useReducerMock.mockImplementation((reducer: symbol) => {
      if (reducer === mocks.reducers.startScenario) {
        return mocks.startScenarioMock;
      }
      if (reducer === mocks.reducers.recordChoice) {
        return mocks.recordChoiceMock;
      }
      if (reducer === mocks.reducers.performSkillCheck) {
        return mocks.performSkillCheckMock;
      }
      return vi.fn();
    });

    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tables.contentVersion) {
        return [state.contentVersionRows, state.contentVersionReady];
      }
      if (table === mocks.tables.contentSnapshot) {
        return [state.contentSnapshotRows, state.contentSnapshotReady];
      }
      if (table === mocks.tables.vnSession) {
        return [state.sessionRows, state.sessionReady];
      }
      if (table === mocks.tables.vnSkillCheckResult) {
        return [state.skillResultRows, true];
      }
      return [[], true];
    });
  });

  it("does not autostart before session table hydration", async () => {
    const payloadJson = makeSnapshotPayload(
      [
        {
          id: "sandbox_case01_pilot",
          title: "Case01",
          startNodeId: "node_start",
          nodeIds: ["node_start"],
        },
      ],
      [
        {
          id: "node_start",
          scenarioId: "sandbox_case01_pilot",
          title: "Start",
          body: "Body",
          choices: [],
        },
      ],
    );
    state.contentSnapshotRows = [
      {
        checksum: "checksum_v1",
        payloadJson,
        createdAt: timestamp(2n),
      },
    ];
    state.sessionReady = false;

    const view = render(<VnScreen />);

    expect(mocks.startScenarioMock).not.toHaveBeenCalled();

    state.sessionReady = true;
    view.rerender(<VnScreen />);

    await waitFor(() => {
      expect(mocks.startScenarioMock).toHaveBeenCalledTimes(1);
    });
  });

  it("blocks repeated AUTO_CONTINUE taps while choice is pending", async () => {
    const payloadJson = makeSnapshotPayload(
      [
        {
          id: "sandbox_case01_pilot",
          title: "Case01",
          startNodeId: "node_start",
          nodeIds: ["node_start", "node_next"],
        },
      ],
      [
        {
          id: "node_start",
          scenarioId: "sandbox_case01_pilot",
          title: "Start",
          body: "Body",
          choices: [
            {
              id: "AUTO_CONTINUE_NODE_START",
              text: "Auto Hidden Continue",
              nextNodeId: "node_next",
            },
          ],
        },
        {
          id: "node_next",
          scenarioId: "sandbox_case01_pilot",
          title: "Next",
          body: "Body",
          choices: [],
        },
      ],
    );
    state.contentSnapshotRows = [
      {
        checksum: "checksum_v1",
        payloadJson,
        createdAt: timestamp(3n),
      },
    ];
    state.sessionRows = [
      {
        sessionKey: "me::sandbox_case01_pilot",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_start",
        updatedAt: timestamp(10n),
        completedAt: { tag: "none" },
      },
    ];

    mocks.recordChoiceMock.mockImplementation(
      () => new Promise<void>(() => undefined),
    );

    render(<VnScreen />);

    expect(
      screen.queryByRole("button", { name: /Auto Hidden Continue/i }),
    ).toBeNull();

    const tap = screen.getByRole("button", { name: "surface-tap" });
    fireEvent.click(tap);
    fireEvent.click(tap);

    await waitFor(() => {
      expect(mocks.recordChoiceMock).toHaveBeenCalledTimes(1);
    });
    expect(mocks.recordChoiceMock.mock.calls[0]?.[0]?.choiceId).toBe(
      "AUTO_CONTINUE_NODE_START",
    );
  });

  it("enters handoff_failed and blocks repeated completion taps", async () => {
    const payloadJson = makeSnapshotPayload(
      [
        {
          id: "sandbox_case01_pilot",
          title: "Case01",
          startNodeId: "node_terminal",
          nodeIds: ["node_terminal"],
          completionRoute: {
            nextScenarioId: "scenario_next",
          },
        },
        {
          id: "scenario_next",
          title: "Next",
          startNodeId: "next_start",
          nodeIds: ["next_start"],
        },
      ],
      [
        {
          id: "node_terminal",
          scenarioId: "sandbox_case01_pilot",
          title: "End",
          body: "Body",
          terminal: true,
          choices: [],
        },
        {
          id: "next_start",
          scenarioId: "scenario_next",
          title: "Next Start",
          body: "Body",
          choices: [],
        },
      ],
    );
    state.contentSnapshotRows = [
      {
        checksum: "checksum_v1",
        payloadJson,
        createdAt: timestamp(4n),
      },
    ];
    state.sessionRows = [
      {
        sessionKey: "me::sandbox_case01_pilot",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_terminal",
        updatedAt: timestamp(11n),
        completedAt: { tag: "some", value: timestamp(12n) },
      },
    ];
    mocks.startScenarioMock.mockRejectedValue(
      new Error("Scenario start is blocked by completion route rules"),
    );

    const onNavigateTab = vi.fn();
    render(<VnScreen onNavigateTab={onNavigateTab} />);

    await waitFor(() => {
      expect(mocks.startScenarioMock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(onNavigateTab).toHaveBeenCalledWith("map");
    });

    fireEvent.click(screen.getByRole("button", { name: "surface-tap" }));

    await waitFor(() => {
      expect(mocks.startScenarioMock).toHaveBeenCalledTimes(1);
    });
    expect(onNavigateTab).toHaveBeenCalledTimes(1);
  });
});
