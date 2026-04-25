import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VnScreen } from "./VnScreen";
import {
  AI_DIALOGUE_SOURCE_SKILL_CHECK,
  AI_GENERATE_DIALOGUE_KIND,
} from "../../ai/contracts";

const mocks = vi.hoisted(() => {
  const tables = {
    contentVersion: Symbol("contentVersion"),
    contentSnapshot: Symbol("contentSnapshot"),
    myVnSessions: Symbol("myVnSessions"),
    myVnSkillResults: Symbol("myVnSkillResults"),
    myAiRequests: Symbol("myAiRequests"),
    myQuests: Symbol("myQuests"),
    myNpcState: Symbol("myNpcState"),
    myNpcFavors: Symbol("myNpcFavors"),
    myAgencyCareer: Symbol("myAgencyCareer"),
    myRumorState: Symbol("myRumorState"),
  };
  const reducers = {
    startScenario: Symbol("startScenario"),
    recordChoice: Symbol("recordChoice"),
    performSkillCheck: Symbol("performSkillCheck"),
    enqueueAiRequest: Symbol("enqueueAiRequest"),
  };

  return {
    tables,
    reducers,
    useTableMock: vi.fn(),
    useReducerMock: vi.fn(),
    startScenarioMock: vi.fn(),
    recordChoiceMock: vi.fn(),
    performSkillCheckMock: vi.fn(),
    enqueueAiRequestMock: vi.fn(),
    useIdentityMock: vi.fn(),
    usePlayerFlagsMock: vi.fn(() => ({})),
    usePlayerVarsMock: vi.fn(),
    playVnSkillCheckSfxMock: vi.fn(),
    readVnSfxMutedMock: vi.fn(),
    writeVnSfxMutedMock: vi.fn(),
    stableDictionary: { vn: {}, stats: {}, speakers: {}, origin: {} },
    useI18nMock: vi.fn(),
  };
});

mocks.useI18nMock.mockReturnValue({
  dictionary: mocks.stableDictionary,
  language: "en",
  isLoaded: true,
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

vi.mock("../../i18n/I18nContext", () => ({
  useI18n: () => mocks.useI18nMock(),
}));

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

vi.mock("../../../config", () => ({
  ENABLE_AI: true,
  RELEASE_PROFILE: "freiburg_detective",
}));

vi.mock("../../../widgets/vn-overlay/VnNarrativePanel", () => ({
  VnNarrativePanel: ({
    children,
    choicesSlot,
    backgroundVideoUrl,
    locationName,
    narrativeText,
    narrativeLayout,
    onVideoEnded,
    onSurfaceTap,
  }: any) => (
    <div>
      <div data-testid="location-name">{locationName}</div>
      <div data-testid="narrative-text">{narrativeText}</div>
      <div data-testid="narrative-layout">{narrativeLayout}</div>
      <div data-testid="background-video-url">{backgroundVideoUrl}</div>
      <button type="button" onClick={onSurfaceTap}>
        surface-tap
      </button>
      <button type="button" onClick={onVideoEnded}>
        video-ended
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
  writeVnSfxMuted: (...args: unknown[]) => mocks.writeVnSfxMutedMock(...args),
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
  aiRequestRows: any[];
};

const makeSnapshotPayload = (
  scenarios: unknown[],
  nodes: unknown[],
  overrides: Record<string, unknown> = {},
): string =>
  JSON.stringify({
    schemaVersion: 2,
    scenarios,
    nodes,
    vnRuntime: {
      skillCheckDice: "d20",
      defaultEntryScenarioId: "sandbox_case01_pilot",
    },
    mindPalace: overrides.mindPalace ?? {
      cases: [],
      facts: [],
      hypotheses: [],
    },
    ...overrides,
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
      aiRequestRows: [],
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
    mocks.enqueueAiRequestMock.mockResolvedValue(undefined);

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
      if (reducer === mocks.reducers.enqueueAiRequest) {
        return mocks.enqueueAiRequestMock;
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
      if (table === mocks.tables.myVnSessions) {
        return [state.sessionRows, state.sessionReady];
      }
      if (table === mocks.tables.myVnSkillResults) {
        return [state.skillResultRows, true];
      }
      if (table === mocks.tables.myAiRequests) {
        return [state.aiRequestRows, true];
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
          nodeIds: ["node_start", "node_next"],
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

  it("allows surface tap to skip cinematic advance (same as video end)", async () => {
    const payloadJson = makeSnapshotPayload(
      [
        {
          id: "sandbox_case01_pilot",
          title: "Case01",
          startNodeId: "node_video",
          nodeIds: ["node_video", "node_next"],
        },
      ],
      [
        {
          id: "node_video",
          scenarioId: "sandbox_case01_pilot",
          title: "Arrival Reel",
          body: "",
          narrativeLayout: "fullscreen",
          backgroundVideoUrl: "/VN/start/video/Bahn.mp4",
          advanceOnVideoEnd: true,
          choices: [
            {
              id: "AUTO_CONTINUE_NODE_VIDEO",
              text: "Continue.",
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
        nodeId: "node_video",
        updatedAt: timestamp(10n),
        completedAt: { tag: "none" },
      },
    ];

    render(<VnScreen />);

    expect(screen.getByTestId("narrative-layout")).toHaveTextContent(
      "fullscreen",
    );
    fireEvent.click(screen.getByRole("button", { name: "surface-tap" }));

    await waitFor(() => {
      expect(mocks.recordChoiceMock).toHaveBeenCalledTimes(1);
    });
    expect(mocks.recordChoiceMock.mock.calls[0]?.[0]?.choiceId).toBe(
      "AUTO_CONTINUE_NODE_VIDEO",
    );

    fireEvent.click(screen.getByRole("button", { name: "video-ended" }));
    expect(mocks.recordChoiceMock).toHaveBeenCalledTimes(1);
  });

  it("derives letter_overlay layout and hides runtime chrome for letters", () => {
    const payloadJson = makeSnapshotPayload(
      [
        {
          id: "sandbox_case01_pilot",
          title: "Case01",
          startNodeId: "node_letter",
          nodeIds: ["node_letter", "node_next"],
        },
      ],
      [
        {
          id: "node_letter",
          scenarioId: "sandbox_case01_pilot",
          title: "Letter",
          body: "Orders from the Agency",
          narrativePresentation: "letter",
          choices: [
            {
              id: "AUTO_CONTINUE_NODE_LETTER",
              text: "Continue.",
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
        nodeId: "node_letter",
        updatedAt: timestamp(10n),
        completedAt: { tag: "none" },
      },
    ];

    render(<VnScreen />);

    expect(screen.getByTestId("narrative-layout")).toHaveTextContent(
      "letter_overlay",
    );
    expect(screen.getByTestId("choices-slot")).toBeEmptyDOMElement();
    expect(screen.queryByRole("combobox")).toBeNull();
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

  it("renders Russian VN narrative and choice text from stable content IDs", async () => {
    mocks.usePlayerFlagsMock.mockReturnValue({ lang_ru: true });
    mocks.useI18nMock.mockReturnValue({
      language: "ru",
      dictionary: {
        vn: {
          "vn.case01_hbf_arrival.title": "Дело 01: Прибытие во Фрайбург",
          "vn.case01_hbf_arrival.scene_case01_beat1_atmosphere.body":
            "Фрайбург встретил его запахом угля и пара.",
          "vn.case01_hbf_arrival.scene_case01_beat1_atmosphere.choice.CASE01_BEAT1_POLICE":
            "Обратиться к железнодорожной полиции",
        },
        stats: {},
        speakers: {},
        origin: {},
      },
      isLoaded: true,
      t: (key: string) => key,
    });

    const payloadJson = makeSnapshotPayload(
      [
        {
          id: "case01_hbf_arrival",
          title: "Case 01: Freiburg Arrival",
          startNodeId: "scene_case01_beat1_atmosphere",
          nodeIds: ["scene_case01_beat1_atmosphere", "scene_case01_hbf_police"],
        },
      ],
      [
        {
          id: "scene_case01_beat1_atmosphere",
          scenarioId: "case01_hbf_arrival",
          title: "Hauptbahnhof, Freiburg",
          body: "Steam folds around the iron columns.",
          choices: [
            {
              id: "CASE01_BEAT1_POLICE",
              text: "Approach the railway police post.",
              nextNodeId: "scene_case01_hbf_police",
            },
          ],
        },
        {
          id: "scene_case01_hbf_police",
          scenarioId: "case01_hbf_arrival",
          title: "Police Post",
          body: "Police post.",
          choices: [],
        },
      ],
    );
    state.contentSnapshotRows = [
      {
        checksum: "checksum_v1",
        payloadJson,
        createdAt: timestamp(50n),
      },
    ];
    state.sessionRows = [
      {
        sessionKey: "me::case01_hbf_arrival",
        playerId: identity("me"),
        scenarioId: "case01_hbf_arrival",
        nodeId: "scene_case01_beat1_atmosphere",
        updatedAt: timestamp(51n),
        completedAt: { tag: "none" },
      },
    ];

    render(<VnScreen initialScenarioId="case01_hbf_arrival" />);

    await waitFor(() => {
      expect(screen.getByTestId("location-name")).toHaveTextContent(
        "Дело 01: Прибытие во Фрайбург",
      );
    });
    expect(screen.getByTestId("narrative-text")).toHaveTextContent("Фрайбург");
    expect(
      screen.getByRole("button", {
        name: /Обратиться к железнодорожной полиции/i,
      }),
    ).toBeInTheDocument();
  });

  it("runs cinematic success resolve and commits only after dismiss", async () => {
    vi.useFakeTimers();
    mocks.usePlayerVarsMock.mockReturnValue({
      attr_social: 4,
      psyche_axis_x: 58,
      psyche_axis_y: -22,
      psyche_approach: 44,
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
    expect(screen.getByText("CHECK PRIMED")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Roll" }));
    expect(mocks.performSkillCheckMock).toHaveBeenCalledTimes(1);

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
    fireEvent.click(screen.getByRole("button", { name: "Roll" }));
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
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByText("DICE IN MOTION")).toBeInTheDocument();

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
    fireEvent.click(screen.getByRole("button", { name: "Roll" }));

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
      await vi.advanceTimersByTimeAsync(300);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(screen.getByTestId("narrative-text")).toHaveTextContent(
      "Old node body",
    );
    expect(mocks.recordChoiceMock).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "surface-tap" }));
    });
    expect(screen.getByTestId("narrative-text")).toHaveTextContent(
      "New node body",
    );
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
    fireEvent.click(screen.getByRole("button", { name: "Roll" }));
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

  it("enqueues one supported AI request after an active skill check resolves", async () => {
    mocks.usePlayerVarsMock.mockReturnValue({
      attr_social: 4,
      psyche_axis_x: 58,
      psyche_axis_y: -22,
      psyche_approach: 44,
    });

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
          body: "Steam and tension hang over the tailor's counter.",
          voicePresenceMode: "parliament",
          activeSpeakers: ["attr_social", "attr_logic"],
          choices: [
            {
              id: "choice_probe",
              text: "Lean in and make the tailor talk.",
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

    fireEvent.click(screen.getByRole("button", { name: /Lean in and make/i }));
    fireEvent.click(screen.getByRole("button", { name: "Roll" }));

    state.skillResultRows = [
      {
        resultKey: "result_probe",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_start",
        checkId: "check_probe",
        roll: 9,
        voiceLevel: 4,
        difficulty: 8,
        passed: true,
        nextNodeId: { tag: "none" },
        breakdownJson: {
          tag: "some",
          value:
            '[{"source":"voice","sourceId":"attr_social","delta":4},{"source":"preparation","sourceId":"tailor_dossier","delta":2}]',
        },
        outcomeGrade: { tag: "some", value: "critical" },
        createdAt: timestamp(19n),
      },
    ];

    await act(async () => {
      view.rerender(<VnScreen />);
      await Promise.resolve();
    });

    expect(mocks.enqueueAiRequestMock).toHaveBeenCalledTimes(1);

    const request = mocks.enqueueAiRequestMock.mock.calls[0]?.[0];
    expect(request.kind).toBe(AI_GENERATE_DIALOGUE_KIND);

    const payload = JSON.parse(request.payloadJson);
    expect(payload).toMatchObject({
      source: AI_DIALOGUE_SOURCE_SKILL_CHECK,
      scenarioId: "sandbox_case01_pilot",
      nodeId: "node_start",
      checkId: "check_probe",
      choiceId: "choice_probe",
      voiceId: "attr_social",
      choiceText: "Lean in and make the tailor talk.",
      passed: true,
      roll: 9,
      difficulty: 8,
      voiceLevel: 4,
      locationName: "Case01",
      outcomeGrade: "critical",
      margin: 7,
      voicePresenceMode: "parliament",
      activeSpeakers: ["attr_social", "attr_logic"],
      psycheProfile: {
        axisX: 58,
        axisY: -22,
        approach: 44,
        dominantInnerVoiceId: "inner_manipulator",
        activeInnerVoiceIds: [],
      },
    });
    expect(payload.breakdown).toEqual([
      { source: "voice", sourceId: "attr_social", delta: 4 },
      { source: "preparation", sourceId: "tailor_dossier", delta: 2 },
    ]);
    expect(payload.sceneResultEnvelope).toMatchObject({
      source: "skill_check",
      scenarioId: "sandbox_case01_pilot",
      nodeId: "node_start",
      locationName: "Case01",
      playerState: {
        flags: [],
        activeQuests: [],
        voiceLevels: {
          attr_social: 4,
        },
        psyche: {
          axisX: 58,
          axisY: -22,
          approach: 44,
          dominantInnerVoiceId: "inner_manipulator",
          activeInnerVoiceIds: [],
        },
      },
      checkResult: {
        checkId: "check_probe",
        voiceId: "attr_social",
        outcomeGrade: "critical",
        margin: 7,
        breakdown: [
          { source: "voice", sourceId: "attr_social", delta: 4 },
          {
            source: "preparation",
            sourceId: "tailor_dossier",
            delta: 2,
          },
        ],
      },
      ensemble: {
        presenceMode: "parliament",
        activeSpeakers: ["attr_social", "attr_logic"],
      },
    });

    await act(async () => {
      view.rerender(<VnScreen />);
    });

    expect(mocks.enqueueAiRequestMock).toHaveBeenCalledTimes(1);
  });

  it("renders inner voice cards and authored choice chips for inner parliament scenes", () => {
    mocks.usePlayerVarsMock.mockReturnValue({
      psyche_axis_x: 72,
      psyche_axis_y: 64,
      psyche_approach: 60,
    });

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
          body: "A courier trembles in the doorway.",
          voicePresenceMode: "parliament",
          activeSpeakers: ["inner_leader", "inner_guide", "inner_cynic"],
          choices: [
            {
              id: "choice_help",
              text: "Hide the courier.",
              nextNodeId: "node_start",
              innerVoiceHints: [
                {
                  voiceId: "inner_leader",
                  stance: "supports",
                  text: "Protect him before the room turns.",
                },
                {
                  voiceId: "inner_cynic",
                  stance: "opposes",
                  text: "Mercy spends leverage.",
                },
              ],
            },
          ],
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

    render(<VnScreen />);

    expect(screen.getAllByText("Leader").length).toBeGreaterThan(0);
    expect(screen.getByText("Guide")).toBeInTheDocument();
    expect(screen.getAllByText("Cynic").length).toBeGreaterThan(0);
    expect(screen.getByText("supports")).toBeInTheDocument();
    expect(screen.getByText("opposes")).toBeInTheDocument();
  });

  it("shows AI thinking state and completed copy on the skill-check resolve surface", async () => {
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
          body: "Steam and tension hang over the tailor's counter.",
          choices: [
            {
              id: "choice_probe",
              text: "Lean in and make the tailor talk.",
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

    fireEvent.click(screen.getByRole("button", { name: /Lean in and make/i }));
    fireEvent.click(screen.getByRole("button", { name: "Roll" }));
    state.skillResultRows = [
      {
        resultKey: "result_probe",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_start",
        checkId: "check_probe",
        roll: 9,
        voiceLevel: 4,
        difficulty: 8,
        passed: true,
        nextNodeId: { tag: "none" },
        createdAt: timestamp(30n),
      },
    ];

    await act(async () => {
      view.rerender(<VnScreen />);
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(mocks.enqueueAiRequestMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    fireEvent.click(screen.getByRole("button", { name: "surface-tap" }));

    expect(screen.getByText("Inner Parliament")).toBeInTheDocument();
    expect(
      screen.getByText("Charisma is turning the result over..."),
    ).toBeInTheDocument();

    state.aiRequestRows = [
      {
        id: 1n,
        playerId: identity("me"),
        requestId: "ai-probe",
        kind: AI_GENERATE_DIALOGUE_KIND,
        payloadJson: mocks.enqueueAiRequestMock.mock.calls[0]?.[0].payloadJson,
        status: "completed",
        responseJson: {
          tag: "some",
          value:
            '{"text":"Push now. He is already leaning.","canonicalVoiceId":"charisma"}',
        },
        error: { tag: "none" },
        createdAt: timestamp(31n),
        updatedAt: timestamp(32n),
      },
    ];

    await act(async () => {
      view.rerender(<VnScreen />);
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(
      screen.getByText("Push now. He is already leaning."),
    ).toBeInTheDocument();
  });

  it("shows the active lens badge when a focused hypothesis gates the current node", () => {
    mocks.usePlayerFlagsMock.mockReturnValue({
      "mind_focus::case_focus::hyp_focus": true,
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
              id: "choice_focus",
              text: "Follow the archive lead",
              nextNodeId: "node_next",
              requireAll: [
                {
                  type: "hypothesis_focus_is",
                  caseId: "case_focus",
                  hypothesisId: "hyp_focus",
                },
              ],
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
      {
        mindPalace: {
          cases: [{ id: "case_focus", title: "Focus Case" }],
          facts: [],
          hypotheses: [
            {
              id: "hyp_focus",
              caseId: "case_focus",
              key: "focus_key",
              text: "Archive clerk runs the diversion.",
              requiredFactIds: [],
              requiredVars: [],
              rewardEffects: [],
            },
          ],
        },
      },
    );
    state.contentSnapshotRows = [
      {
        checksum: "checksum_v1",
        payloadJson,
        createdAt: timestamp(9n),
      },
    ];
    state.sessionRows = [
      {
        sessionKey: "me::sandbox_case01_pilot",
        playerId: identity("me"),
        scenarioId: "sandbox_case01_pilot",
        nodeId: "node_start",
        updatedAt: timestamp(20n),
        completedAt: { tag: "none" },
      },
    ];

    render(<VnScreen />);

    expect(
      screen.getByText("Active Lens: Archive clerk runs the diversion."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Follow the archive lead" }),
    ).toBeInTheDocument();
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
