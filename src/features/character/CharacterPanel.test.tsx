import { fireEvent, render, screen, within } from "@testing-library/react";
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

vi.mock("framer-motion", async () => {
  const React = await import("react");

  type MotionProps = {
    children?: React.ReactNode;
    animate?: unknown;
    exit?: unknown;
    initial?: unknown;
    layoutId?: string;
    transition?: unknown;
  } & Record<string, unknown>;

  const createMotionComponent = (tag: string) =>
    React.forwardRef<HTMLElement, MotionProps>(function MotionComponent(
      {
        animate: _animate,
        children,
        exit: _exit,
        initial: _initial,
        layoutId: _layoutId,
        transition: _transition,
        ...props
      },
      ref,
    ) {
      return React.createElement(
        tag,
        { ref, ...props },
        children as React.ReactNode,
      );
    });

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    motion: new Proxy(
      {},
      {
        get: (_target, key) => createMotionComponent(String(key)),
      },
    ),
  };
});

vi.mock("recharts", async () => {
  const React = await import("react");

  return {
    ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    RadarChart: ({ children }: { children?: React.ReactNode }) => (
      <svg data-testid="radar-chart">{children}</svg>
    ),
    PolarGrid: () => null,
    PolarAngleAxis: () => null,
    PolarRadiusAxis: () => null,
    Radar: () => null,
  };
});

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

const fullSnapshot = {
  schemaVersion: 4,
  scenarios: [],
  nodes: [],
  mysticism: {
    entityArchetypes: [
      {
        id: "echo_hound",
        label: "Echo Hound",
        veilLevel: 2,
        signatures: ["cold"],
        habitats: ["rail"],
        temperament: "tracking",
        witnessValue: 2,
        rationalCoverStories: ["stray dog"],
        allowedManifestations: ["trace"],
      },
    ],
    observations: [
      {
        id: "obs_hidden_platform",
        kind: "trace",
        title: "Hidden Platform Draft",
        text: "The rail kept its cold after the traffic cleared.",
        entityArchetypeId: "echo_hound",
        signatureIds: ["cold"],
        rationalInterpretation: "Weather inversion and stress remain plausible.",
      },
    ],
  },
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
};

describe("CharacterPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.debugEnabled = false;
    mocks.useIdentityMock.mockReturnValue({ identityHex: "me" });
    mocks.usePlayerFlagsMock.mockReturnValue({ origin_journalist: true });
    mocks.usePlayerVarsMock.mockReturnValue({
      attr_intellect: 3,
      attr_encyclopedia: 4,
      attr_perception: 2,
      attr_shadow: 2,
      attr_deception: 5,
      attr_social: 2,
      attr_physical: 1,
      attr_psyche: 2,
      attr_spirit: 1,
      checks_passed: 3,
      mystic_awakening: 42,
      mystic_exposure: 2,
      mystic_rationalist_buffer: 6,
      mystic_sight_mode_tier: 1,
    });

    mocks.parseSnapshotMock.mockReturnValue(fullSnapshot);

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

  it("renders dossier tabs and nests specialized stats under the right core cards", () => {
    render(<CharacterPanel />);

    expect(screen.getByRole("tab", { name: /Profile/i })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Development/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Psyche/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Journal/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Development/i }));

    expect(screen.getByText("Core Characteristic Radar")).toBeInTheDocument();
    expect(screen.getByTestId("character-radar")).toBeInTheDocument();

    const intellectCard = screen.getByTestId("core-attr-attr_intellect");
    expect(within(intellectCard).getByText("Encyclopedia")).toBeInTheDocument();
    expect(within(intellectCard).getByText("Perception")).toBeInTheDocument();

    const shadowCard = screen.getByTestId("core-attr-attr_shadow");
    expect(within(shadowCard).getByText("Deception")).toBeInTheDocument();
  });

  it("renders quest titles and resolved objective point names in the journal tab", () => {
    mocks.usePlayerFlagsMock.mockReturnValue({
      origin_journalist: true,
      mystic_obs_obs_hidden_platform: true,
    });

    render(<CharacterPanel />);

    fireEvent.click(screen.getByRole("tab", { name: /Journal/i }));

    expect(screen.getAllByText("Bank Case")).toHaveLength(2);
    expect(screen.getByText("Bankhaus J.A. Krebs")).toBeInTheDocument();
    expect(screen.getByText("Hidden Platform Draft")).toBeInTheDocument();
    expect(screen.getByText(/Echo Hound/i)).toBeInTheDocument();
    expect(screen.queryByText("loc_freiburg_bank")).not.toBeInTheDocument();
  });

  it("shows awakening state on the psyche tab and in the header chips", () => {
    render(<CharacterPanel />);

    expect(screen.getByText("Fracture")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Psyche/i }));

    expect(screen.getAllByText("Awakening")).not.toHaveLength(0);
    expect(screen.getByText("Sensitive")).toBeInTheDocument();
    expect(screen.getByText("Rational Buffer")).toBeInTheDocument();
  });

  it("shows empty-state copy when no quest catalog is available", () => {
    mocks.parseSnapshotMock.mockReturnValue({
      ...fullSnapshot,
      map: { ...fullSnapshot.map, points: [] },
      questCatalog: [],
    });

    render(<CharacterPanel />);
    fireEvent.click(screen.getByRole("tab", { name: /Journal/i }));

    expect(
      screen.getByText("No quest catalog is available in active content."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Objectives become available after content publish."),
    ).toBeInTheDocument();
  });

  it("shows debug blocks only when debug content seed mode is enabled", () => {
    const { rerender } = render(<CharacterPanel />);

    expect(screen.queryByText("Raw Flags")).not.toBeInTheDocument();
    expect(screen.queryByText("Raw Vars")).not.toBeInTheDocument();

    mocks.debugEnabled = true;
    rerender(<CharacterPanel />);

    expect(screen.getByText("Raw Flags")).toBeInTheDocument();
    expect(screen.getByText("Raw Vars")).toBeInTheDocument();
  });
});
