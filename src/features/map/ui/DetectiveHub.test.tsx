import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CANONICAL_FACTION_REGISTRY } from "../../../../data/factionContract";
import type { RuntimeMapPoint } from "../types";
import { DetectiveHub } from "./DetectiveHub";

const mocks = vi.hoisted(() => ({
  useTableMock: vi.fn(),
  useIdentityMock: vi.fn(),
  parseSnapshotMock: vi.fn(),
  tablesMock: {
    myPlayerInventory: Symbol("myPlayerInventory"),
    myRelationships: Symbol("myRelationships"),
    myNpcState: Symbol("myNpcState"),
    myNpcFavors: Symbol("myNpcFavors"),
    myAgencyCareer: Symbol("myAgencyCareer"),
    myPlayerFlags: Symbol("myPlayerFlags"),
    contentVersion: Symbol("contentVersion"),
    contentSnapshot: Symbol("contentSnapshot"),
  },
}));

vi.mock("spacetimedb/react", () => ({
  useTable: (...args: unknown[]) => mocks.useTableMock(...args),
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

const socialSnapshot = {
  socialCatalog: {
    factions: CANONICAL_FACTION_REGISTRY,
    npcIdentities: [
      {
        id: "npc_anna_mahler",
        displayName: "Anna Mahler",
        factionId: "city_network",
        publicRole: "Railway fixer",
        rosterTier: "major",
      },
    ],
    services: [],
    rumors: [],
    careerRanks: [
      {
        id: "trainee",
        label: "Ð¡Ñ‚Ð°Ð¶Ñ‘Ñ€",
        order: 0,
        standingRequired: -100,
        serviceCriteriaNeeded: 0,
        privileges: [],
      },
    ],
  },
};

const basePoint: RuntimeMapPoint = {
  id: "loc_agency",
  regionId: "FREIBURG_1905",
  title: "Grenzwanderer Agency",
  lat: 47.99,
  lng: 7.85,
  locationId: "loc_agency",
  category: "HUB",
  description: "Central bureau",
  state: "discovered",
  availableBindings: [
    {
      id: "bind_briefing",
      trigger: "card_primary",
      label: "Investigate",
      priority: 100,
      intent: "objective",
      actions: [{ type: "start_scenario", scenarioId: "sandbox_case01_pilot" }],
      hasStartScenario: true,
      hasTravelAction: false,
    },
  ],
  primaryBinding: {
    id: "bind_briefing",
    trigger: "card_primary",
    label: "Investigate",
    priority: 100,
    intent: "objective",
    actions: [{ type: "start_scenario", scenarioId: "sandbox_case01_pilot" }],
    hasStartScenario: true,
    hasTravelAction: false,
  },
  travelBinding: null,
  isObjectiveActive: true,
  canTravel: false,
  resolvedScenarioId: "sandbox_case01_pilot",
  canStartScenario: true,
  isVisible: true,
};

describe("DetectiveHub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useIdentityMock.mockReturnValue({ identityHex: "me" });
    mocks.parseSnapshotMock.mockReturnValue(socialSnapshot);

    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.myPlayerInventory) {
        return [
          [
            {
              inventoryKey: "inv_1",
              itemId: "lockpick_kit",
              quantity: 2,
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.myRelationships) {
        return [
          [
            {
              relationshipKey: "rel_1",
              characterId: "npc_anna_mahler",
              value: 12,
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.myNpcState) {
        return [
          [
            {
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
              npcId: "npc_anna_mahler",
              balance: 1,
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.myAgencyCareer) {
        return [
          [
            {
              standingScore: 18,
              rankId: "trainee",
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.myPlayerFlags) {
        return [
          [
            {
              key: "INTRO_COMPLETED",
              value: false,
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

  it("switches tabs and shows subscribed inventory and partner data", async () => {
    const user = userEvent.setup();

    render(
      <DetectiveHub
        point={basePoint}
        currentLocationId={null}
        onRunBinding={vi.fn().mockResolvedValue(undefined)}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/first briefing is still pending/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Ð¡Ñ‚Ð°Ð¶Ñ‘Ñ€")).toBeInTheDocument();
    expect(screen.getByText("Duty Roster")).toBeInTheDocument();
    expect(screen.getByText("Lotte Weber")).toBeInTheDocument();
    expect(screen.getByText("Marta Klein")).toBeInTheDocument();
    expect(screen.getByText("1 contacts")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Inventory" }));
    expect(screen.getByText("lockpick_kit")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Partners" }));
    expect(screen.getByText("Anna Mahler")).toBeInTheDocument();
    expect(screen.getByText("Railway fixer")).toBeInTheDocument();

    const annaCard = screen.getByText("Anna Mahler").closest("article");
    expect(annaCard).not.toBeNull();
    expect(
      within(annaCard as HTMLElement).getByText(
        (_content, element) =>
          element?.tagName === "SPAN" &&
          (element.textContent?.includes("ÐŸÐµÑ€ÑÐ¾Ð½Ð°Ð¶") === true ||
            element.textContent?.includes("ÃÅ¸ÃÂµÃ‘â‚¬Ã‘ÂÃÂ¾ÃÂ½ÃÂ°ÃÂ¶") ===
              true),
      ),
    ).toBeInTheDocument();
  });

  it("runs the primary briefing action", async () => {
    const user = userEvent.setup();
    const onRunBinding = vi.fn().mockResolvedValue(undefined);

    render(
      <DetectiveHub
        point={basePoint}
        currentLocationId={null}
        onRunBinding={onRunBinding}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open briefing" }));

    expect(onRunBinding).toHaveBeenCalledWith(
      basePoint,
      basePoint.primaryBinding,
    );
  });
});
