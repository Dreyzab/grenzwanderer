import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RuntimeMapPoint } from "../types";
import { CaseCard } from "./CaseCard";

const mocks = vi.hoisted(() => ({
  useTableMock: vi.fn(),
  parseSnapshotMock: vi.fn(),
  usePlayerFlagsMock: vi.fn(),
  usePlayerVarsMock: vi.fn(),
  tablesMock: {
    contentVersion: Symbol("contentVersion"),
    contentSnapshot: Symbol("contentSnapshot"),
  },
}));

vi.mock("spacetimedb/react", () => ({
  useTable: (...args: unknown[]) => mocks.useTableMock(...args),
  useReducer: () => vi.fn(),
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

const basePoint: RuntimeMapPoint = {
  id: "loc_freiburg_bank",
  regionId: "FREIBURG_1905",
  title: "Bankhaus J.A. Krebs",
  lat: 47.99,
  lng: 7.85,
  category: "PUBLIC",
  locationId: "loc_freiburg_bank",
  description: "Crime scene",
  state: "discovered",
  bindings: [
    {
      id: "bind_start",
      trigger: "card_primary",
      label: "Investigate",
      priority: 100,
      intent: "objective",
      conditions: [
        {
          type: "relationship_gte",
          characterId: "npc_baroness_elise",
          value: 25,
        },
        {
          type: "agency_standing_gte",
          value: 15,
        },
      ],
      actions: [
        { type: "start_scenario", scenarioId: "sandbox_case01_pilot" },
        {
          type: "change_favor_balance",
          npcId: "npc_baroness_elise",
          delta: -1,
        },
      ],
    },
    {
      id: "bind_archive_route",
      trigger: "card_secondary",
      label: "Archive route",
      priority: 60,
      intent: "interaction",
      actions: [{ type: "set_flag", key: "archive_route", value: true }],
    },
  ],
  availableBindings: [
    {
      id: "bind_start",
      trigger: "card_primary",
      label: "Investigate",
      priority: 100,
      intent: "objective",
      actions: [
        { type: "start_scenario", scenarioId: "sandbox_case01_pilot" },
        {
          type: "change_favor_balance",
          npcId: "npc_baroness_elise",
          delta: -1,
        },
      ],
      hasStartScenario: true,
      hasTravelAction: false,
    },
    {
      id: "bind_archive_route",
      trigger: "card_secondary",
      label: "Archive route",
      priority: 60,
      intent: "interaction",
      actions: [{ type: "set_flag", key: "archive_route", value: true }],
      hasStartScenario: false,
      hasTravelAction: false,
    },
    {
      id: "sys_travel_loc_freiburg_bank",
      trigger: "card_secondary",
      label: "Travel",
      priority: 10,
      intent: "travel",
      actions: [{ type: "travel_to", locationId: "loc_freiburg_bank" }],
      hasStartScenario: false,
      hasTravelAction: true,
    },
  ],
  primaryBinding: {
    id: "bind_start",
    trigger: "card_primary",
    label: "Investigate",
    priority: 100,
    intent: "objective",
    actions: [
      { type: "start_scenario", scenarioId: "sandbox_case01_pilot" },
      {
        type: "change_favor_balance",
        npcId: "npc_baroness_elise",
        delta: -1,
      },
    ],
    hasStartScenario: true,
    hasTravelAction: false,
  },
  travelBinding: {
    id: "sys_travel_loc_freiburg_bank",
    trigger: "card_secondary",
    label: "Travel",
    priority: 10,
    intent: "travel",
    actions: [{ type: "travel_to", locationId: "loc_freiburg_bank" }],
    hasStartScenario: false,
    hasTravelAction: true,
  },
  isObjectiveActive: true,
  canTravel: true,
  resolvedScenarioId: "sandbox_case01_pilot",
  canStartScenario: true,
  isVisible: true,
};

describe("CaseCard", () => {
  const socialSnapshot = {
    socialCatalog: {
      npcIdentities: [
        {
          id: "npc_baroness_elise",
          displayName: "Baroness Elise",
          factionId: "financial_bloc",
          publicRole: "Patron",
          rosterTier: "major",
        },
      ],
      services: [],
      rumors: [],
      careerRanks: [
        {
          id: "trainee",
          label: "Стажёр",
          order: 0,
          standingRequired: -100,
          serviceCriteriaNeeded: 0,
          privileges: [],
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.parseSnapshotMock.mockReturnValue(socialSnapshot);
    mocks.usePlayerFlagsMock.mockReturnValue({});
    mocks.usePlayerVarsMock.mockReturnValue({});
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.contentVersion) {
        return [[{ checksum: "abc", isActive: true }], true];
      }
      if (table === mocks.tablesMock.contentSnapshot) {
        return [[{ checksum: "abc", payloadJson: "{}" }], true];
      }
      return [[], true];
    });
  });

  it("shows unavailable scenario hint when point cannot start scenario", () => {
    render(
      <CaseCard
        point={{
          ...basePoint,
          canStartScenario: false,
          resolvedScenarioId: null,
        }}
        currentLocationId={null}
        onRunBinding={vi.fn().mockResolvedValue(undefined)}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/scenario action is not available/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Investigate" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Social Requirement")).toBeInTheDocument();
    expect(
      screen.getByText(/Baroness Elise: Над.+контакт/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Social Cost")).toBeInTheDocument();
    expect(screen.getByText(/owe Baroness Elise a favor/i)).toBeInTheDocument();
    expect(screen.getByText("Fallback Route")).toBeInTheDocument();
    expect(screen.getByText("Archive route")).toBeInTheDocument();
    expect(screen.getByText("Local Cast")).toBeInTheDocument();
    expect(screen.getByText("Johann Kessler")).toBeInTheDocument();
    expect(screen.getByText("Irmgard Vetter")).toBeInTheDocument();
    expect(screen.getByText("Scene Owner")).toBeInTheDocument();
    expect(screen.getByText("Supporting Contacts")).toBeInTheDocument();
  });

  it("shows reducer-derived error on failed action", async () => {
    const user = userEvent.setup();
    const onRunBinding = vi
      .fn()
      .mockRejectedValue(new Error("conditions_failed"));

    render(
      <CaseCard
        point={basePoint}
        currentLocationId={null}
        onRunBinding={onRunBinding}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Investigate" }));

    await waitFor(() => {
      expect(
        screen.getByText("Action is currently locked by conditions."),
      ).toBeInTheDocument();
    });
  });

  it("disables travel button when player is already at location", () => {
    render(
      <CaseCard
        point={basePoint}
        currentLocationId="loc_freiburg_bank"
        onRunBinding={vi.fn().mockResolvedValue(undefined)}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Here" })).toBeDisabled();
  });

  it("shows pending label while action is running", async () => {
    const user = userEvent.setup();
    let resolveAction = () => {};
    const onRunBinding = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );

    render(
      <CaseCard
        point={basePoint}
        currentLocationId={null}
        onRunBinding={onRunBinding}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Investigate" }));

    expect(
      screen.getByRole("button", { name: "Investigate..." }),
    ).toBeDisabled();

    resolveAction();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Investigate" })).toBeEnabled();
    });
  });

  it("describes nested social gates from logic_or conditions", () => {
    render(
      <CaseCard
        point={{
          ...basePoint,
          bindings: [
            {
              id: "bind_social_gate",
              trigger: "card_primary",
              label: "Student House",
              priority: 100,
              intent: "interaction",
              conditions: [
                {
                  type: "logic_or",
                  conditions: [
                    {
                      type: "favor_balance_gte",
                      npcId: "npc_baroness_elise",
                      value: 1,
                    },
                    {
                      type: "agency_standing_gte",
                      value: 15,
                    },
                  ],
                },
              ],
              actions: [
                {
                  type: "start_scenario",
                  scenarioId: "sandbox_student_house_access",
                },
              ],
            },
          ],
          availableBindings: [
            {
              id: "bind_social_gate",
              trigger: "card_primary",
              label: "Student House",
              priority: 100,
              intent: "interaction",
              actions: [
                {
                  type: "start_scenario",
                  scenarioId: "sandbox_student_house_access",
                },
              ],
              hasStartScenario: true,
              hasTravelAction: false,
            },
          ],
          primaryBinding: {
            id: "bind_social_gate",
            trigger: "card_primary",
            label: "Student House",
            priority: 100,
            intent: "interaction",
            actions: [
              {
                type: "start_scenario",
                scenarioId: "sandbox_student_house_access",
              },
            ],
            hasStartScenario: true,
            hasTravelAction: false,
          },
          travelBinding: null,
        }}
        currentLocationId={null}
        onRunBinding={vi.fn().mockResolvedValue(undefined)}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Baroness Elise owes you a favor or Agency standing/i),
    ).toBeInTheDocument();
  });
});
