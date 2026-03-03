import { describe, expect, it } from "vitest";
import type { MapPoint } from "../types";
import { derivePointState } from "./derivePointState";

const point: MapPoint = {
  id: "loc_freiburg_bank",
  regionId: "FREIBURG_1905",
  title: "Bank",
  lat: 47.99,
  lng: 7.85,
  locationId: "loc_freiburg_bank",
  unlockGroup: "loc_freiburg_bank",
};

describe("derivePointState", () => {
  it("returns locked by default", () => {
    const state = derivePointState(point, null, new Set(), new Set());

    expect(state).toBe("locked");
  });

  it("returns discovered when unlock group is present", () => {
    const state = derivePointState(
      point,
      null,
      new Set(),
      new Set(["loc_freiburg_bank"]),
    );

    expect(state).toBe("discovered");
  });

  it("returns visited when current location matches point", () => {
    const state = derivePointState(
      point,
      "loc_freiburg_bank",
      new Set(),
      new Set(["loc_freiburg_bank"]),
    );

    expect(state).toBe("visited");
  });

  it("returns visited when VISITED_* flag exists", () => {
    const state = derivePointState(
      point,
      null,
      new Set(["VISITED_loc_freiburg_bank"]),
      new Set(),
    );

    expect(state).toBe("visited");
  });

  it("keeps visited priority over discovered", () => {
    const state = derivePointState(
      point,
      "loc_freiburg_bank",
      new Set(),
      new Set(["loc_freiburg_bank"]),
    );

    expect(state).toBe("visited");
  });

  it("returns completed when COMPLETED_* flag is set", () => {
    const state = derivePointState(
      point,
      "loc_freiburg_bank",
      new Set(["VISITED_loc_freiburg_bank"]),
      new Set(["loc_freiburg_bank"]),
      new Set(["COMPLETED_loc_freiburg_bank"]),
    );

    expect(state).toBe("completed");
  });
});
