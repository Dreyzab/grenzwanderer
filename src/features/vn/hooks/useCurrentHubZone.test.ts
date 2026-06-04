import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { VnHubSchema } from "../types";
import { hubZoneFlagKey, useCurrentHubZone } from "./useCurrentHubZone";

const buildSchema = (overrides: Partial<VnHubSchema> = {}): VnHubSchema => ({
  id: "train_hub",
  imageUrl: "/images/train_interior_eleanor_map.svg",
  viewBox: "0 0 2400 1000",
  aspectRatio: 2.4,
  defaultCurrentZoneId: "compartment",
  zones: [
    {
      id: "compartment",
      label: "Купе",
      svgPath: "M0 0 H10 V10 H0 Z",
    },
    {
      id: "dining_car",
      label: "Вагон-ресторан",
      svgPath: "M20 0 H30 V10 H20 Z",
    },
  ],
  ...overrides,
});

describe("useCurrentHubZone", () => {
  it("returns null when no schema is provided", () => {
    const { result } = renderHook(() => useCurrentHubZone(null, {}));
    expect(result.current).toBeNull();
  });

  it("falls back to defaultCurrentZoneId when no flag is set", () => {
    const schema = buildSchema();
    const { result } = renderHook(() => useCurrentHubZone(schema, {}));
    expect(result.current).toBe("compartment");
  });

  it("returns the zone whose flag is true", () => {
    const schema = buildSchema();
    const flags = {
      [hubZoneFlagKey("train_hub", "dining_car")]: true,
    };
    const { result } = renderHook(() => useCurrentHubZone(schema, flags));
    expect(result.current).toBe("dining_car");
  });

  it("prefers the first declared zone when several flags read true", () => {
    const schema = buildSchema();
    const flags = {
      [hubZoneFlagKey("train_hub", "compartment")]: true,
      [hubZoneFlagKey("train_hub", "dining_car")]: true,
    };
    const { result } = renderHook(() => useCurrentHubZone(schema, flags));
    expect(result.current).toBe("compartment");
  });

  it("returns null when no flag matches and no default is declared", () => {
    const schema = buildSchema({ defaultCurrentZoneId: undefined });
    const { result } = renderHook(() => useCurrentHubZone(schema, {}));
    expect(result.current).toBeNull();
  });

  it("ignores defaultCurrentZoneId that doesn't resolve to a zone", () => {
    const schema = buildSchema({ defaultCurrentZoneId: "phantom_car" });
    const { result } = renderHook(() => useCurrentHubZone(schema, {}));
    expect(result.current).toBeNull();
  });
});
