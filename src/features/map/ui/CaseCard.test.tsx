import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RuntimeMapPoint } from "../types";
import { CaseCard } from "./CaseCard";

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
  availableBindings: [
    {
      id: "bind_start",
      trigger: "card_primary",
      label: "Investigate",
      priority: 100,
      intent: "objective",
      actions: [{ type: "start_scenario", scenarioId: "sandbox_case01_pilot" }],
      hasStartScenario: true,
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
    actions: [{ type: "start_scenario", scenarioId: "sandbox_case01_pilot" }],
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
});
