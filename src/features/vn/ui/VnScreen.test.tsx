import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    playVnSkillCheckSfxMock: vi.fn(),
    readVnSfxMutedMock: vi.fn(),
    writeVnSfxMutedMock: vi.fn(),
  };
});

vi.mock("framer-motion", async () => {
  const React = await import("react");

  type MotionProps = {
    children?: React.ReactNode;
    animate?: unknown;
    exit?: unknown;
    initial?: unknown;
    transition?: unknown;
  } & Record<string, unknown>;

  const createMotionComponent = (tag: keyof HTMLElementTagNameMap) =>
    React.forwardRef<HTMLElementTagNameMap[typeof tag], MotionProps>(
      function MotionComponent(
        {
          animate: _animate,
          children,
          exit: _exit,
          initial: _initial,
          transition: _transition,
          ...props
        },
        ref,
      ) {
        return React.createElement(
          tag as keyof HTMLElementTagNameMap,
          { ref, ...props },
          children as React.ReactNode,
        );
      },
    );

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    motion: new Proxy(
      {},
      {
        get: (_target, key) =>
          createMotionComponent(key as keyof HTMLElementTagNameMap),
      },
    ),
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
  VnNarrativePanel: ({
    children,
    choicesSlot,
    locationName,
    narrativeText,
    onSurfaceTap,
  }: any) => (
    <div>
      <div data-testid="location-name">{locationName}</div>
      <div data-testid="narrative-text">{narrativeText}</div>
      <button type="button" onClick={onSurfaceTap}>
        surface-tap
      </button>
      <div data-testid="overlay-slot">{children}</div>
      <div data-testid="choices-slot">{choicesSlot}</div>
    </div>
  ),
}));

vi.mock("./vnSkillCheckAudio", () => ({
  playVnSkillCheckSfx: (...args: unknown[]) =>
    mocks.playVnSkillCheckSfxMock(...args),
  readVnSfxMuted: () => mocks.readVnSfxMutedMock(),
  writeVnSfxMuted: (...args: unknown[]) =>
    mocks.writeVnSfxMutedMock(...args),
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
    vi.useRealTimers();

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
    mocks.readVnSfxMutedMock.mockReturnValue(false);
    mocks.writeVnSfxMutedMock.mockReturnValue(undefined);
    mocks.playVnSkillCheckSfxMock.mockResolvedValue(undefined);

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

  it("autostarts when authenticated even if the raw session ready flag lags", async () => {
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

    render(<VnScreen />);

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

  it("shows chance percent only for opted-in active checks", () => {
    mocks.usePlayerVarsMock.mockReturnValue({
      attr_social: 4,
      attr_perception: 4,
    });

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
              id: "choice_probe",
              text: "Probe witness",
              nextNodeId: "node_next",
              skillCheck: {
                id: "check_probe",
                voiceId: "attr_social",
                difficulty: 8,
                showChancePercent: true,
              },
            },
            {
              id: "choice_watch",
              text: "Watch quietly",
              nextNodeId: "node_next",
              skillCheck: {
                id: "check_watch",
                voiceId: "attr_perception",
                difficulty: 8,
              },
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
        createdAt: timestamp(5n),
      },
    ];
    state.sessionRows = [
      {
        sessionKey: "me::sandbox_case01_pilot",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_start",
        updatedAt: timestamp(13n),
        completedAt: { tag: "none" },
      },
    ];

    render(<VnScreen />);

    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("Probe witness")).toBeInTheDocument();
    expect(screen.getByText("Watch quietly")).toBeInTheDocument();
    expect(screen.queryByText("100%")).toBeNull();
  });

  it("runs cinematic success resolve and commits only after dismiss", async () => {
    vi.useFakeTimers();
    mocks.usePlayerVarsMock.mockReturnValue({ attr_social: 4 });

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
              id: "choice_probe",
              text: "Probe witness",
              nextNodeId: "node_next",
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
        createdAt: timestamp(6n),
      },
    ];
    state.sessionRows = [
      {
        sessionKey: "me::sandbox_case01_pilot",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_start",
        updatedAt: timestamp(14n),
        completedAt: { tag: "none" },
      },
    ];

    const view = render(<VnScreen />);

    fireEvent.click(screen.getByRole("button", { name: /Probe witness/i }));
    expect(mocks.performSkillCheckMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("CHECK PRIMED")).toBeInTheDocument();

    state.skillResultRows = [
      {
        resultKey: "result_a",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_start",
        checkId: "check_probe",
        roll: 7,
        voiceLevel: 4,
        difficulty: 8,
        passed: true,
        nextNodeId: { tag: "none" },
        createdAt: timestamp(15n),
      },
    ];
    await act(async () => {
      view.rerender(<VnScreen />);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByText("DICE IN MOTION")).toBeInTheDocument();
    expect(mocks.recordChoiceMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    expect(mocks.playVnSkillCheckSfxMock).toHaveBeenCalledWith(true, false);
    expect(screen.getByText("THE ROOM YIELDS")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByText("SUCCESS")).toBeInTheDocument();
    expect(screen.getByText(/Roll 7 \+ 4 vs DC 8/i)).toBeInTheDocument();
    expect(screen.getByText(/85% predicted/i)).toBeInTheDocument();
    expect(mocks.recordChoiceMock).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "surface-tap" }));
    });
    expect(mocks.recordChoiceMock).toHaveBeenCalledTimes(1);
  });

  it("skips the active animation on tap and dismisses on the next tap", async () => {
    vi.useFakeTimers();
    mocks.usePlayerVarsMock.mockReturnValue({ attr_social: 4 });

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
              id: "choice_probe",
              text: "Probe witness",
              nextNodeId: "node_next",
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
        createdAt: timestamp(26n),
      },
    ];
    state.sessionRows = [
      {
        sessionKey: "me::sandbox_case01_pilot",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_start",
        updatedAt: timestamp(27n),
        completedAt: { tag: "none" },
      },
    ];

    const view = render(<VnScreen />);

    fireEvent.click(screen.getByRole("button", { name: /Probe witness/i }));
    state.skillResultRows = [
      {
        resultKey: "result_skip",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_start",
        checkId: "check_probe",
        roll: 7,
        voiceLevel: 4,
        difficulty: 8,
        passed: true,
        nextNodeId: { tag: "none" },
        createdAt: timestamp(28n),
      },
    ];
    await act(async () => {
      view.rerender(<VnScreen />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "surface-tap" }));
    });
    expect(screen.getByText("SUCCESS")).toBeInTheDocument();
    expect(mocks.recordChoiceMock).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "surface-tap" }));
    });
    expect(mocks.recordChoiceMock).toHaveBeenCalledTimes(1);
  });

  it("freezes the current node until dismiss when the skill result branches server-side", async () => {
    vi.useFakeTimers();
    mocks.usePlayerVarsMock.mockReturnValue({ attr_social: 4 });

    const payloadJson = makeSnapshotPayload(
      [
        {
          id: "sandbox_case01_pilot",
          title: "Case01",
          startNodeId: "node_start",
          nodeIds: ["node_start", "node_branch"],
        },
      ],
      [
        {
          id: "node_start",
          scenarioId: "sandbox_case01_pilot",
          title: "Start",
          body: "Old node body",
          choices: [
            {
              id: "choice_probe",
              text: "Probe witness",
              nextNodeId: "node_branch",
              skillCheck: {
                id: "check_probe",
                voiceId: "attr_social",
                difficulty: 8,
                showChancePercent: true,
                onSuccess: {
                  nextNodeId: "node_branch",
                },
              },
            },
          ],
        },
        {
          id: "node_branch",
          scenarioId: "sandbox_case01_pilot",
          title: "Branch",
          body: "New node body",
          choices: [],
        },
      ],
    );
    state.contentSnapshotRows = [
      {
        checksum: "checksum_v1",
        payloadJson,
        createdAt: timestamp(29n),
      },
    ];
    state.sessionRows = [
      {
        sessionKey: "me::sandbox_case01_pilot",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_start",
        updatedAt: timestamp(30n),
        completedAt: { tag: "none" },
      },
    ];

    const view = render(<VnScreen />);

    fireEvent.click(screen.getByRole("button", { name: /Probe witness/i }));

    state.skillResultRows = [
      {
        resultKey: "result_branch",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_start",
        checkId: "check_probe",
        roll: 7,
        voiceLevel: 4,
        difficulty: 8,
        passed: true,
        nextNodeId: { tag: "some", value: "node_branch" },
        createdAt: timestamp(31n),
      },
    ];
    state.sessionRows = [
      {
        sessionKey: "me::sandbox_case01_pilot",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_branch",
        updatedAt: timestamp(32n),
        completedAt: { tag: "none" },
      },
    ];
    await act(async () => {
      view.rerender(<VnScreen />);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByTestId("narrative-text")).toHaveTextContent("Old node body");
    expect(mocks.recordChoiceMock).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "surface-tap" }));
    });
    expect(screen.getByTestId("narrative-text")).toHaveTextContent("New node body");
    expect(mocks.recordChoiceMock).not.toHaveBeenCalled();
  });

  it("shows passive check feedback without playing active-check audio", () => {
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
          passiveChecks: [
            {
              id: "check_passive",
              voiceId: "attr_perception",
              difficulty: 7,
              isPassive: true,
            },
          ],
          choices: [],
        },
      ],
    );
    state.contentSnapshotRows = [
      {
        checksum: "checksum_v1",
        payloadJson,
        createdAt: timestamp(7n),
      },
    ];
    state.sessionRows = [
      {
        sessionKey: "me::sandbox_case01_pilot",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_start",
        updatedAt: timestamp(16n),
        completedAt: { tag: "none" },
      },
    ];
    state.skillResultRows = [
      {
        resultKey: "passive_a",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_start",
        checkId: "check_passive",
        roll: 5,
        voiceLevel: 2,
        difficulty: 7,
        passed: true,
        nextNodeId: { tag: "none" },
        createdAt: timestamp(17n),
      },
    ];

    render(<VnScreen />);

    expect(screen.getByText("Passive Check")).toBeInTheDocument();
    expect(mocks.playVnSkillCheckSfxMock).not.toHaveBeenCalled();
  });

  it("persists mute state across rerender and suppresses SFX playback", async () => {
    vi.useFakeTimers();
    mocks.usePlayerVarsMock.mockReturnValue({ attr_social: 4 });

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
              id: "choice_probe",
              text: "Probe witness",
              nextNodeId: "node_next",
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
        createdAt: timestamp(8n),
      },
    ];
    state.sessionRows = [
      {
        sessionKey: "me::sandbox_case01_pilot",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_start",
        updatedAt: timestamp(18n),
        completedAt: { tag: "none" },
      },
    ];

    const view = render(<VnScreen />);

    fireEvent.click(
      screen.getByRole("button", { name: /Mute skill check audio/i }),
    );
    expect(
      screen.getByRole("button", { name: /Unmute skill check audio/i }),
    ).toBeInTheDocument();
    await act(async () => {
      view.rerender(<VnScreen />);
    });
    expect(
      screen.getByRole("button", { name: /Unmute skill check audio/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Probe witness/i }));
    state.skillResultRows = [
      {
        resultKey: "result_b",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_start",
        checkId: "check_probe",
        roll: 7,
        voiceLevel: 4,
        difficulty: 8,
        passed: true,
        nextNodeId: { tag: "none" },
        createdAt: timestamp(19n),
      },
    ];
    await act(async () => {
      view.rerender(<VnScreen />);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(mocks.playVnSkillCheckSfxMock).not.toHaveBeenCalled();
    expect(mocks.writeVnSfxMutedMock).toHaveBeenCalledWith(true);
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
