import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CANONICAL_FACTION_REGISTRY } from "../../../data/factionContract";
import { CharacterPanel } from "./CharacterPanel";

const mocks = vi.hoisted(() => ({
  useTableMock: vi.fn(),
  useIdentityMock: vi.fn(),
  parseSnapshotMock: vi.fn(),
  usePlayerFlagsMock: vi.fn(),
  usePlayerVarsMock: vi.fn(),
  debugEnabled: false,
  tablesMock: {
    myPlayerProfile: Symbol("myPlayerProfile"),
    myQuests: Symbol("myQuests"),
    myNpcState: Symbol("myNpcState"),
    myNpcFavors: Symbol("myNpcFavors"),
    myFactionSignals: Symbol("myFactionSignals"),
    myAgencyCareer: Symbol("myAgencyCareer"),
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
  useReducer: () => vi.fn(),
}));

vi.mock("../../shared/spacetime/useIdentity", () => ({
  useIdentity: () => mocks.useIdentityMock(),
}));

vi.mock("../../shared/spacetime/bindings", () => ({
  tables: mocks.tablesMock,
  reducers: {
    startScenario: Symbol("startScenario"),
  },
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

vi.mock("../../entities/player/hooks/usePlayerBindings", () => ({
  usePlayerBindings: () => {
    const [profiles] = mocks.useTableMock(mocks.tablesMock.myPlayerProfile);
    const [quests] = mocks.useTableMock(mocks.tablesMock.myQuests);
    const [npcState] = mocks.useTableMock(mocks.tablesMock.myNpcState);
    const [npcFavors] = mocks.useTableMock(mocks.tablesMock.myNpcFavors);
    const [factionSignals] = mocks.useTableMock(
      mocks.tablesMock.myFactionSignals,
    );
    const [agencyCareer] = mocks.useTableMock(mocks.tablesMock.myAgencyCareer);
    return {
      identityHex: mocks.useIdentityMock().identityHex,
      flags: mocks.usePlayerFlagsMock(),
      vars: mocks.usePlayerVarsMock(),
      profile: profiles[0] ?? null,
      location: null,
      inventory: [],
      quests,
      relationships: [],
      npcState,
      npcFavors,
      factionSignals,
      agencyCareer: agencyCareer[0] ?? null,
      rows: {
        flags: [],
        vars: [],
        profiles,
        locations: [],
        inventory: [],
        quests,
        relationships: [],
        npcState,
        npcFavors,
        factionSignals,
        agencyCareer,
      },
    };
  },
}));

vi.mock("../../config", () => ({
  get ENABLE_DEBUG_CONTENT_SEED() {
    return mocks.debugEnabled;
  },
  RELEASE_PROFILE: "default",
}));

const makeIdentity = (hex: string) => ({
  toHexString: () => hex,
});

const fullSnapshot = {
  schemaVersion: 7,
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
        rationalInterpretation:
          "Weather inversion and stress remain plausible.",
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
      {
        id: "loc_rathaus",
        title: "Rathaus",
        regionId: "FREIBURG_1905",
        lat: 47.991,
        lng: 7.851,
        locationId: "loc_rathaus",
        bindings: [],
      },
      {
        id: "loc_workers_pub",
        title: "The Red Cog Tavern",
        regionId: "FREIBURG_1905",
        lat: 47.992,
        lng: 7.852,
        locationId: "loc_workers_pub",
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
    {
      id: "quest_dog",
      title: "Dog Trail",
      stages: [
        {
          stage: 1,
          title: "Open Dog Briefing",
          objectiveHint: "Review the mayor's dog file",
          objectivePointIds: ["loc_rathaus"],
        },
      ],
    },
    {
      id: "quest_ghost",
      title: "Ghost Dossier",
      stages: [
        {
          stage: 1,
          title: "Estate Survey",
          objectiveHint: "Pick up the ghost file from the workers' tavern",
          objectivePointIds: ["loc_workers_pub"],
        },
      ],
    },
  ],
  socialCatalog: {
    factions: CANONICAL_FACTION_REGISTRY,
    npcIdentities: [
      {
        id: "npc_anna_mahler",
        displayName: "Anna Mahler",
        factionId: "city_network",
        publicRole: "Railway fixer",
        rosterTier: "major",
        serviceIds: ["svc_anna_info", "svc_anna_intro"],
      },
      {
        id: "npc_archivist_otto",
        displayName: "Archivist Otto",
        factionId: "city_chancellery",
        publicRole: "Archive clerk",
        rosterTier: "functional",
        serviceIds: ["svc_otto_archives"],
      },
      {
        id: "npc_banker_kessler",
        displayName: "Johann Kessler",
        factionId: "house_of_pledges",
        publicRole: "Bank director",
        rosterTier: "major",
        introFlag: "banker_intro_seen",
      },
    ],
    services: [
      {
        id: "svc_anna_info",
        npcId: "npc_anna_mahler",
        role: "information",
        label: "Information",
        baseAccess: "Shared during field meetings.",
      },
      {
        id: "svc_anna_intro",
        npcId: "npc_anna_mahler",
        role: "social_introduction",
        label: "Social Introduction",
        baseAccess: "Requires basic rapport.",
      },
      {
        id: "svc_otto_archives",
        npcId: "npc_archivist_otto",
        role: "archives",
        label: "Archives",
        baseAccess: "Agency filing access.",
      },
    ],
    rumors: [
      {
        id: "rumor_bank_rail_yard",
        title: "Rail yard movement",
        caseId: "quest_banker",
        leadPointId: "loc_freiburg_bank",
        sourceNpcId: "npc_anna_mahler",
        verifiesOn: ["map_unlock"],
        careerCriterionOnVerify: "verified_rumor_chain",
      },
    ],
    careerRanks: [
      {
        id: "trainee",
        label: "Стажёр",
        order: 0,
        standingRequired: -100,
        serviceCriteriaNeeded: 0,
        privileges: [],
      },
      {
        id: "junior_detective",
        label: "Младший детектив",
        order: 1,
        standingRequired: 15,
        qualifyingCaseId: "quest_banker",
        serviceCriteriaNeeded: 2,
        privileges: ["Field warrant"],
      },
    ],
  },
};

describe("CharacterPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.debugEnabled = false;
    mocks.useIdentityMock.mockReturnValue({ identityHex: "me" });
    mocks.usePlayerFlagsMock.mockReturnValue({
      origin_journalist: true,
      track_whistleblower_tier1: true,
    });
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
      psyche_axis_x: 70,
      psyche_axis_y: 62,
      psyche_approach: 64,
      mystic_awakening: 42,
      mystic_exposure: 2,
      mystic_rationalist_buffer: 6,
      mystic_sight_mode_tier: 1,
    });

    mocks.parseSnapshotMock.mockReturnValue(fullSnapshot);

    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.myPlayerProfile) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              nickname: { tag: "some", value: "Operator Anna" },
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.myQuests) {
        return [
          [{ playerId: makeIdentity("me"), questId: "quest_banker", stage: 1 }],
          true,
        ];
      }
      if (table === mocks.tablesMock.myNpcState) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              npcId: "npc_anna_mahler",
              trustScore: 32,
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.myNpcFavors) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              npcId: "npc_anna_mahler",
              balance: 1,
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.myFactionSignals) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              factionId: "city_chancellery",
              value: 22,
              trend: "rising",
            },
            {
              playerId: makeIdentity("me"),
              factionId: "house_of_pledges",
              value: 6,
              trend: "stable",
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.myAgencyCareer) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              standingScore: 18,
              standingTrend: "rising",
              rankId: "trainee",
              rumorCriterionComplete: true,
              sourceCriterionComplete: false,
              cleanClosureCriterionComplete: false,
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

  it("renders dossier tabs and nests specialized stats under the right core cards", () => {
    render(<CharacterPanel />);

    expect(screen.getByRole("tab", { name: /Profile/i })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Development/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Psyche/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Journal/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Стаж/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        (content) => content.includes("ÐÐ°Ð´") || content.includes("Над"),
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Anna Mahler")).toBeInTheDocument();
    expect(
      screen.getByText("Services: Information, Social Introduction"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Johann Kessler")).not.toBeInTheDocument();
    expect(screen.getByText("1/3 logged")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Development/i }));

    expect(screen.getByText("Core Characteristic Radar")).toBeInTheDocument();
    expect(screen.getByTestId("character-radar")).toBeInTheDocument();
    expect(
      screen.getByText("Legacy Attributes -> Canonical Voices"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("attr_intellect -> logic").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText("The world is a machine. Find the fault line."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Make them enjoy telling you what hurts them."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Meaning hides in patterns the rational eye refuses."),
    ).toBeInTheDocument();

    const intellectCard = screen.getByTestId("core-attr-attr_intellect");
    expect(within(intellectCard).getByText("Encyclopedia")).toBeInTheDocument();
    expect(within(intellectCard).getByText("Perception")).toBeInTheDocument();
    expect(
      within(intellectCard).getByText("Canonical voice: Encyclopedia"),
    ).toBeInTheDocument();
    expect(within(intellectCard).getByText("Voice Bridge")).toBeInTheDocument();

    const shadowCard = screen.getByTestId("core-attr-attr_shadow");
    expect(within(shadowCard).getByText("Deception")).toBeInTheDocument();
    expect(
      within(shadowCard).getByText("Canonical voice: Deception"),
    ).toBeInTheDocument();
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

    expect(screen.getAllByText(/Стаж/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        (content) => content.includes("ÐÐ°Ð´") || content.includes("Над"),
      ).length,
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("tab", { name: /Psyche/i }));

    expect(screen.getAllByText("Awakening")).not.toHaveLength(0);
    expect(screen.getByText("Fracture")).toBeInTheDocument();
    expect(screen.getByText("Sensitive")).toBeInTheDocument();
    expect(screen.getByText("Rational Buffer")).toBeInTheDocument();
  });

  it("renders the inner compass with dominant and support voices", () => {
    render(<CharacterPanel />);

    fireEvent.click(screen.getByRole("tab", { name: /Psyche/i }));

    expect(screen.getByText("Inner Compass")).toBeInTheDocument();
    expect(screen.getByTestId("inner-compass")).toBeInTheDocument();
    expect(screen.getAllByText("Leader").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Guide").length).toBeGreaterThan(0);
    expect(screen.getByText("Strong Collectivist")).toBeInTheDocument();
  });

  it("shows player nickname separately from dossier identity and surfaces the selected track", () => {
    render(<CharacterPanel />);

    expect(screen.getByText("Arthur Vance")).toBeInTheDocument();
    expect(screen.getByText("Operator Anna")).toBeInTheDocument();
    expect(screen.getByText("Whistleblower")).toBeInTheDocument();
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

  it("renders all three briefing-seeded cases as active journal entries", () => {
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.myPlayerProfile) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              nickname: { tag: "some", value: "Operator Anna" },
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.myQuests) {
        return [
          [
            { playerId: makeIdentity("me"), questId: "quest_banker", stage: 1 },
            { playerId: makeIdentity("me"), questId: "quest_dog", stage: 1 },
            { playerId: makeIdentity("me"), questId: "quest_ghost", stage: 1 },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.myNpcState) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              npcId: "npc_anna_mahler",
              trustScore: 32,
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.myNpcFavors) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              npcId: "npc_anna_mahler",
              balance: 1,
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.myFactionSignals) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              factionId: "city_chancellery",
              value: 22,
              trend: "rising",
            },
            {
              playerId: makeIdentity("me"),
              factionId: "house_of_pledges",
              value: 6,
              trend: "stable",
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.myAgencyCareer) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              standingScore: 18,
              standingTrend: "rising",
              rankId: "trainee",
              rumorCriterionComplete: true,
              sourceCriterionComplete: false,
              cleanClosureCriterionComplete: false,
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

    render(<CharacterPanel />);
    fireEvent.click(screen.getByRole("tab", { name: /Journal/i }));

    expect(screen.getAllByText("Bank Case").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Dog Trail").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ghost Dossier").length).toBeGreaterThan(0);
    expect(screen.getByText("Rathaus")).toBeInTheDocument();
    expect(screen.getByText("The Red Cog Tavern")).toBeInTheDocument();
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
