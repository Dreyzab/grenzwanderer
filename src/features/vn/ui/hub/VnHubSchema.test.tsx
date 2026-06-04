import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { VnChoice, VnHubSchema as VnHubSchemaType } from "../../types";
import { VnHubSchema } from "./VnHubSchema";

const buildSchema = (): VnHubSchemaType => ({
  id: "train_hub",
  imageUrl: "/images/train_interior_eleanor_map.svg",
  viewBox: "0 0 2400 1000",
  aspectRatio: 2.4,
  defaultCurrentZoneId: "compartment",
  zones: [
    {
      id: "compartment",
      label: "Compartment",
      svgPath: "M80 240 H820 V780 H80 Z",
    },
    {
      id: "corridor",
      label: "Corridor",
      svgPath: "M820 280 H1320 V780 H820 Z",
    },
    {
      id: "dining_car",
      label: "Dining car",
      svgPath: "M1320 220 H2000 V780 H1320 Z",
    },
  ],
});

const buildChoice = (
  overrides: Partial<VnChoice> & {
    hotspot: NonNullable<VnChoice["hotspot"]>;
  },
): VnChoice => ({
  id: overrides.id ?? `choice_${overrides.hotspot.zoneId}`,
  text: overrides.text ?? overrides.hotspot.zoneId,
  nextNodeId: overrides.nextNodeId ?? "scene_case01_train_compartment_letter",
  ...overrides,
});

describe("VnHubSchema", () => {
  it("renders every declared zone and disables zones without a choice", () => {
    const onZoneSelect = vi.fn();
    render(
      <VnHubSchema
        schema={buildSchema()}
        hotspotChoices={[
          buildChoice({ hotspot: { zoneId: "compartment" } }),
          buildChoice({ hotspot: { zoneId: "dining_car" } }),
        ]}
        currentZoneId="compartment"
        onZoneSelect={onZoneSelect}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Compartment" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dining car" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Corridor" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("marks the current zone with aria-current=location", () => {
    render(
      <VnHubSchema
        schema={buildSchema()}
        hotspotChoices={[
          buildChoice({ hotspot: { zoneId: "compartment" } }),
          buildChoice({ hotspot: { zoneId: "dining_car" } }),
        ]}
        currentZoneId="dining_car"
        onZoneSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Dining car" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(
      screen.getByRole("button", { name: "Compartment" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("invokes onZoneSelect with the active choice on click", () => {
    const onZoneSelect = vi.fn();
    const choice = buildChoice({
      id: "HUB_ZONE_DINING",
      text: "Dining",
      hotspot: { zoneId: "dining_car" },
    });
    render(
      <VnHubSchema
        schema={buildSchema()}
        hotspotChoices={[choice]}
        currentZoneId="compartment"
        onZoneSelect={onZoneSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Dining car" }));
    expect(onZoneSelect).toHaveBeenCalledWith(choice);
  });

  it("resolves multiple hotspot choices via priority", () => {
    const onZoneSelect = vi.fn();
    const low = buildChoice({
      id: "HUB_ZONE_DINING_LOW",
      text: "Low",
      hotspot: { zoneId: "dining_car", priority: 0 },
    });
    const high = buildChoice({
      id: "HUB_ZONE_DINING_HIGH",
      text: "High",
      hotspot: { zoneId: "dining_car", priority: 5 },
    });

    render(
      <VnHubSchema
        schema={buildSchema()}
        hotspotChoices={[low, high]}
        currentZoneId="compartment"
        onZoneSelect={onZoneSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Dining car" }));
    expect(onZoneSelect).toHaveBeenCalledTimes(1);
    expect(onZoneSelect).toHaveBeenCalledWith(high);
  });

  it("does not fire onZoneSelect while disabled or locked", () => {
    const onZoneSelect = vi.fn();
    const choice = buildChoice({ hotspot: { zoneId: "compartment" } });
    render(
      <VnHubSchema
        schema={buildSchema()}
        hotspotChoices={[choice]}
        currentZoneId="compartment"
        onZoneSelect={onZoneSelect}
        isChoiceLocked={() => true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Compartment" }));
    expect(onZoneSelect).not.toHaveBeenCalled();
  });

  it("renders visible occupant badges near their zone", () => {
    render(
      <VnHubSchema
        schema={buildSchema()}
        hotspotChoices={[buildChoice({ hotspot: { zoneId: "dining_car" } })]}
        currentZoneId="compartment"
        visibleOccupantsByZoneId={{ dining_car: ["npc_felix_hartmann"] }}
        onZoneSelect={vi.fn()}
      />,
    );

    expect(screen.getByTitle("npc_felix_hartmann")).toBeInTheDocument();
  });
});
