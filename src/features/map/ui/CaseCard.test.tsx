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
  locationId: "loc_freiburg_bank",
  description: "Crime scene",
  state: "discovered",
  canTravel: true,
  resolvedScenarioId: "sandbox_case01_pilot",
  canStartScenario: true,
};

describe("CaseCard", () => {
  it("hides scenario entry when scenario is unavailable", () => {
    render(
      <CaseCard
        point={{
          ...basePoint,
          resolvedScenarioId: null,
          canStartScenario: false,
        }}
        currentLocationId={null}
        onTravel={vi.fn().mockResolvedValue(undefined)}
        onStartScenario={vi.fn().mockResolvedValue(undefined)}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/not available in the active content snapshot/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start Scenario" }),
    ).toBeDisabled();
  });

  it("shows reducer error when scenario start fails", async () => {
    const user = userEvent.setup();
    const onStartScenario = vi
      .fn()
      .mockRejectedValue(new Error("scenario start failed"));

    render(
      <CaseCard
        point={basePoint}
        currentLocationId={null}
        onTravel={vi.fn().mockResolvedValue(undefined)}
        onStartScenario={onStartScenario}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Start Scenario" }));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to start scenario. Please retry."),
      ).toBeInTheDocument();
    });
  });

  it("disables travel button when player is already at location", () => {
    render(
      <CaseCard
        point={basePoint}
        currentLocationId="loc_freiburg_bank"
        onTravel={vi.fn().mockResolvedValue(undefined)}
        onStartScenario={vi.fn().mockResolvedValue(undefined)}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Here" })).toBeDisabled();
  });
});
