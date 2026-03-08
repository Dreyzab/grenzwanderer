import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "./HomePage";

const mocks = vi.hoisted(() => {
  const tables = {
    contentVersion: Symbol("contentVersion"),
    contentSnapshot: Symbol("contentSnapshot"),
    vnSession: Symbol("vnSession"),
    playerFlag: Symbol("playerFlag"),
  };

  return {
    tables,
    reducers: {
      beginFreiburgOrigin: Symbol("beginFreiburgOrigin"),
    },
    useIdentityMock: vi.fn(),
    useTableMock: vi.fn(),
    useReducerMock: vi.fn(),
  };
});

vi.mock("spacetimedb/react", () => ({
  useTable: (...args: unknown[]) => mocks.useTableMock(...args),
  useReducer: (...args: unknown[]) => mocks.useReducerMock(...args),
}));

vi.mock("../shared/spacetime/useIdentity", () => ({
  useIdentity: () => mocks.useIdentityMock(),
}));

vi.mock("../shared/spacetime/bindings", () => ({
  tables: mocks.tables,
  reducers: mocks.reducers,
}));

vi.mock("../shared/ui/ConfirmationModal", () => ({
  ConfirmationModal: ({
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
  }: {
    confirmLabel: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="confirmation-modal">
      <button type="button" onClick={onConfirm}>
        {confirmLabel}
      </button>
      <button type="button" onClick={onCancel}>
        {cancelLabel ?? "Cancel"}
      </button>
    </div>
  ),
}));

vi.mock("../features/origin/ui/OriginSelectionScreen", () => ({
  OriginSelectionScreen: ({
    onConfirmOrigin,
    onCancel,
    status,
  }: {
    onConfirmOrigin: (profileId: string) => void;
    onCancel: () => void;
    status?: string | null;
  }) => (
    <div data-testid="origin-selection">
      <p>{status ?? ""}</p>
      <button type="button" onClick={() => onConfirmOrigin("journalist")}>
        confirm-journalist
      </button>
      <button type="button" onClick={() => onConfirmOrigin("aristocrat")}>
        confirm-aristocrat
      </button>
      <button type="button" onClick={onCancel}>
        selection-cancel
      </button>
    </div>
  ),
}));

const identity = (hex: string) => ({
  toHexString: () => hex,
});

const timestamp = (micros: bigint) => ({
  microsSinceUnixEpoch: micros,
});

const snapshotPayload = JSON.stringify({
  schemaVersion: 2,
  scenarios: [
    {
      id: "origin_journalist_bootstrap",
      title: "Bootstrap",
      startNodeId: "scene_origin_journalist_bootstrap",
      nodeIds: ["scene_origin_journalist_bootstrap"],
      completionRoute: {
        nextScenarioId: "intro_journalist",
        requiredFlagsAll: ["origin_journalist"],
      },
      packId: "system_origin_bootstrap",
    },
    {
      id: "intro_journalist",
      title: "Journalist Intro",
      startNodeId: "scene_journalist_intro",
      nodeIds: ["scene_journalist_intro"],
    },
    {
      id: "intro_aristocrat",
      title: "Aristocrat Intro",
      startNodeId: "scene_aristocrat_intro",
      nodeIds: ["scene_aristocrat_intro"],
    },
    {
      id: "intro_veteran",
      title: "Veteran Intro",
      startNodeId: "scene_veteran_intro",
      nodeIds: ["scene_veteran_intro"],
    },
    {
      id: "intro_archivist",
      title: "Archivist Intro",
      startNodeId: "scene_archivist_intro",
      nodeIds: ["scene_archivist_intro"],
    },
    {
      id: "sandbox_case01_pilot",
      title: "Case 01",
      startNodeId: "scene_intro_journey",
      nodeIds: ["scene_intro_journey"],
    },
  ],
  nodes: [],
  vnRuntime: {
    defaultEntryScenarioId: "sandbox_case01_pilot",
  },
  mindPalace: {
    cases: [],
    facts: [],
    hypotheses: [],
  },
});

type TestState = {
  contentVersionRows: any[];
  contentVersionReady: boolean;
  contentSnapshotRows: any[];
  contentSnapshotReady: boolean;
  sessionRows: any[];
  sessionReady: boolean;
  flagRows: any[];
  flagsReady: boolean;
};

describe("HomePage Freiburg flow", () => {
  let state: TestState;
  let beginFreiburgOriginReducerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    state = {
      contentVersionRows: [
        {
          version: "v1",
          checksum: "checksum_v1",
          isActive: true,
          publishedAt: timestamp(1n),
          schemaVersion: 2,
        },
      ],
      contentVersionReady: true,
      contentSnapshotRows: [
        {
          checksum: "checksum_v1",
          payloadJson: snapshotPayload,
          createdAt: timestamp(2n),
        },
      ],
      contentSnapshotReady: true,
      sessionRows: [],
      sessionReady: true,
      flagRows: [],
      flagsReady: true,
    };

    mocks.useIdentityMock.mockReturnValue({
      identityHex: "me",
      isConnected: true,
      connectionError: undefined,
    });
    beginFreiburgOriginReducerMock = vi.fn().mockResolvedValue(undefined);
    mocks.useReducerMock.mockImplementation((reducer: symbol) => {
      if (reducer === mocks.reducers.beginFreiburgOrigin) {
        return beginFreiburgOriginReducerMock;
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
      if (table === mocks.tables.playerFlag) {
        return [state.flagRows, state.flagsReady];
      }
      return [[], true];
    });
  });

  it("opens origin selection on Continue when no origin is selected", () => {
    render(<HomePage onNavigate={vi.fn()} onOpenVnScenario={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByTestId("origin-selection")).toBeInTheDocument();
  });

  it("treats active snapshot rows as hydrated content even when ready flags lag", () => {
    state.contentVersionReady = false;
    state.contentSnapshotReady = false;

    render(<HomePage onNavigate={vi.fn()} onOpenVnScenario={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByTestId("origin-selection")).toBeInTheDocument();
    expect(screen.queryByText(/Syncing content snapshot/i)).not.toBeInTheDocument();
  });

  it("does not block Freiburg entry when player-state ready flags lag", () => {
    state.sessionReady = false;
    state.flagsReady = false;

    render(<HomePage onNavigate={vi.fn()} onOpenVnScenario={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByTestId("origin-selection")).toBeInTheDocument();
    expect(screen.queryByText(/Syncing player state/i)).not.toBeInTheDocument();
  });

  it("runs confirm reset, unified origin flow, and begin reducer flow", async () => {
    const onOpenVnScenario = vi.fn();

    state.sessionRows = [
      {
        sessionKey: "me::intro_journalist",
        playerId: identity("me"),
        scenarioId: "intro_journalist",
        nodeId: "scene_journalist_intro",
        updatedAt: timestamp(10n),
        completedAt: { tag: "none" },
      },
    ];

    render(
      <HomePage onNavigate={vi.fn()} onOpenVnScenario={onOpenVnScenario} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "New Game" }));
    expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm Reset" }));
    expect(screen.getByTestId("origin-selection")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "confirm-aristocrat" }));

    await waitFor(() => {
      expect(beginFreiburgOriginReducerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          profileId: "aristocrat",
          resetProgress: true,
        }),
      );
      expect(onOpenVnScenario).toHaveBeenCalledWith("intro_aristocrat");
    });
  });

  it("cancels reset confirmation without starting a new game", () => {
    state.sessionRows = [
      {
        sessionKey: "me::intro_journalist",
        playerId: identity("me"),
        scenarioId: "intro_journalist",
        nodeId: "scene_journalist_intro",
        updatedAt: timestamp(10n),
        completedAt: { tag: "none" },
      },
    ];

    render(<HomePage onNavigate={vi.fn()} onOpenVnScenario={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "New Game" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(beginFreiburgOriginReducerMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("confirmation-modal")).not.toBeInTheDocument();
    expect(screen.queryByTestId("origin-selection")).not.toBeInTheDocument();
  });

  it("closes unified origin flow without launching when cancelled from selection", () => {
    render(<HomePage onNavigate={vi.fn()} onOpenVnScenario={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByTestId("origin-selection")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "selection-cancel" }));

    expect(beginFreiburgOriginReducerMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("origin-selection")).not.toBeInTheDocument();
  });

  it("continues active session without starting a new origin", async () => {
    const onOpenVnScenario = vi.fn();

    state.sessionRows = [
      {
        sessionKey: "me::intro_aristocrat",
        playerId: identity("me"),
        scenarioId: "intro_aristocrat",
        nodeId: "scene_aristocrat_intro",
        updatedAt: timestamp(10n),
        completedAt: { tag: "none" },
      },
    ];

    render(
      <HomePage onNavigate={vi.fn()} onOpenVnScenario={onOpenVnScenario} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(beginFreiburgOriginReducerMock).not.toHaveBeenCalled();
      expect(onOpenVnScenario).toHaveBeenCalledWith("intro_aristocrat");
    });
    expect(screen.queryByTestId("origin-selection")).not.toBeInTheDocument();
  });

  it("keeps actions clickable while content sync is incomplete", () => {
    state.contentVersionRows = [];
    state.contentSnapshotRows = [];
    state.contentVersionReady = false;
    state.contentSnapshotReady = false;

    render(<HomePage onNavigate={vi.fn()} onOpenVnScenario={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "New Game" })).not.toBeDisabled();
    expect(screen.getByText(/Syncing content snapshot/i)).toBeInTheDocument();
  });

  it("routes the QR CTA into the map code drawer flow", () => {
    const onNavigate = vi.fn();

    render(<HomePage onNavigate={onNavigate} onOpenVnScenario={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Scan Start Code" }));

    expect(onNavigate).toHaveBeenCalledWith("map", { mapPanel: "qr" });
  });
});
