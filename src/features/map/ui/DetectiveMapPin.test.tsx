import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RuntimeMapPoint } from "../types";
import { DetectiveMapPin } from "./DetectiveMapPin";

const basePoint: RuntimeMapPoint = {
  id: "loc_freiburg_bank",
  regionId: "FREIBURG_1905",
  title: "Bankhaus J.A. Krebs",
  lat: 47.99,
  lng: 7.85,
  category: "PUBLIC",
  locationId: "loc_freiburg_bank",
  description: "Crime scene",
  image: "/images/locations/loc_bankhaus.webp",
  state: "visited",
  availableBindings: [],
  primaryBinding: null,
  travelBinding: null,
  isObjectiveActive: false,
  canTravel: false,
  resolvedScenarioId: null,
  canStartScenario: false,
  isVisible: true,
};

describe("DetectiveMapPin", () => {
  it("renders photo markers with selected state metadata", () => {
    render(
      <DetectiveMapPin point={basePoint} isSelected={true} isZoomedOut={false} onClick={vi.fn()} />,
    );

    const button = screen.getByRole("button", {
      name: /bankhaus j\.a\. krebs \(visited\)/i,
    });

    expect(button).toHaveAttribute("data-state", "visited");
    expect(button).toHaveAttribute("data-selected", "true");
    expect(button).toHaveAttribute("data-visual", "photo");
    expect(button).toHaveAttribute("data-zoomed-out", "false");
    expect(screen.getByText("Bankhaus J.A. Krebs")).toBeInTheDocument();
  });

  it("renders icon fallback markers and completion stamp", () => {
    render(
      <DetectiveMapPin
        point={{
          ...basePoint,
          image: undefined,
          category: "PUBLIC",
          state: "completed",
          isObjectiveActive: true,
        }}
        isSelected={false}
        isZoomedOut={false}
        onClick={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", {
      name: /bankhaus j\.a\. krebs \(completed\)/i,
    });

    expect(button).toHaveAttribute("data-visual", "icon");
    expect(button).toHaveAttribute("data-objective", "true");
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("forwards click events", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <DetectiveMapPin
        point={basePoint}
        isSelected={false}
        isZoomedOut={false}
        onClick={onClick}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: /bankhaus j\.a\. krebs \(visited\)/i,
      }),
    );

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders compact dot when isZoomedOut is true", () => {
    render(
      <DetectiveMapPin
        point={basePoint}
        isSelected={false}
        isZoomedOut={true}
        onClick={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", {
      name: /bankhaus j\.a\. krebs \(visited\)/i,
    });

    expect(button).toHaveAttribute("data-zoomed-out", "true");
    expect(button).toBeInTheDocument();
  });
});
