import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
      startScenario: Symbol("startScenario"),
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

vi.mock("../features/origin/ui/JournalistDossierScreen", () => ({
  OriginDossierScreen: ({
    onConfirm,
    onCancel,
    status,
    disabled,
  }: {
    onConfirm: () => void;
    onCancel: () => void;
    status?: string;
    disabled?: boolean;
  }) => (
    <div data-testid="origin-dossier">
      <p>{status ?? ""}</p>
      <button type="button" onClick={onConfirm} disabled={disabled}>
        dossier-confirm
      </button>
      <button type="button" onClick={onCancel}>
        dossier-cancel
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
      completionRoute: {
        nextScenarioId: "sandbox_case01_pilot",
      },
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
  let startScenarioReducerMock: ReturnType<typeof vi.fn>;
  let confirmMock: {
    mockRestore: () => void;
    mockReturnValue: (value: boolean) => unknown;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    confirmMock = vi.spyOn(window, "confirm").mockReturnValue(true);

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
    startScenarioReducerMock = vi.fn().mockResolvedValue(undefined);
    mocks.useReducerMock.mockImplementation(() => startScenarioReducerMock);

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

  afterEach(() => {
    confirmMock.mockRestore();
  });

  it("opens dossier first and confirms bootstrap scenario", async () => {
    const onOpenVnScenario = vi.fn();

    render(
      <HomePage onNavigate={vi.fn()} onOpenVnScenario={onOpenVnScenario} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByTestId("origin-dossier")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "dossier-confirm" }));

    await waitFor(() => {
      expect(startScenarioReducerMock).toHaveBeenCalledWith(
        expect.objectContaining({ scenarioId: "origin_journalist_bootstrap" }),
      );
      expect(onOpenVnScenario).toHaveBeenCalledWith(
        "origin_journalist_bootstrap",
      );
    });
    expect(onOpenVnScenario).toHaveBeenCalledTimes(1);
  });

  it("continues active session without forcing restart", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(startScenarioReducerMock).not.toHaveBeenCalled();
      expect(onOpenVnScenario).toHaveBeenCalledWith("intro_journalist");
    });
    expect(screen.queryByTestId("origin-dossier")).not.toBeInTheDocument();
  });

  it("starts fresh for active session on New Game", async () => {
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

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledTimes(1);
      expect(startScenarioReducerMock).toHaveBeenCalledWith(
        expect.objectContaining({ scenarioId: "intro_journalist" }),
      );
      expect(onOpenVnScenario).toHaveBeenCalledWith("intro_journalist");
    });
    expect(screen.queryByTestId("origin-dossier")).not.toBeInTheDocument();
  });

  it("does not restart when reset confirmation is cancelled", async () => {
    const onOpenVnScenario = vi.fn();
    confirmMock.mockReturnValue(false);

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

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledTimes(1);
    });
    expect(startScenarioReducerMock).not.toHaveBeenCalled();
    expect(onOpenVnScenario).not.toHaveBeenCalled();
  });

  it("keeps actions clickable while sync is incomplete", () => {
    const onOpenVnScenario = vi.fn();
    state.sessionReady = false;

    render(
      <HomePage onNavigate={vi.fn()} onOpenVnScenario={onOpenVnScenario} />,
    );

    expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "New Game" })).not.toBeDisabled();
    expect(screen.getByText(/Syncing player state/i)).toBeInTheDocument();
  });
});
