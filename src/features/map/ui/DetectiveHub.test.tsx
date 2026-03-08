import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RuntimeMapPoint } from "../types";
import { DetectiveHub } from "./DetectiveHub";

const mocks = vi.hoisted(() => ({
  useTableMock: vi.fn(),
  tablesMock: {
    playerInventory: Symbol("playerInventory"),
    playerRelationship: Symbol("playerRelationship"),
    playerFlag: Symbol("playerFlag"),
  },
}));

vi.mock("spacetimedb/react", () => ({
  useTable: (...args: unknown[]) => mocks.useTableMock(...args),
}));

vi.mock("../../../shared/spacetime/bindings", () => ({
  tables: mocks.tablesMock,
}));

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

    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.playerInventory) {
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
      if (table === mocks.tablesMock.playerRelationship) {
        return [
          [
            {
              relationshipKey: "rel_1",
              characterId: "inspector_huber",
              value: 3,
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerFlag) {
        return [[], true];
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

    await user.click(screen.getByRole("button", { name: "Inventory" }));
    expect(screen.getByText("lockpick_kit")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Partners" }));
    expect(screen.getByText("inspector_huber")).toBeInTheDocument();
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
