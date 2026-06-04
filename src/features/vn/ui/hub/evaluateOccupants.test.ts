import { describe, expect, it } from "vitest";
import {
  collectVisibleOccupantNpcIds,
  evaluateOccupants,
} from "./evaluateOccupants";
import type { VnHubZoneOccupant } from "../../types";

const FELIX: VnHubZoneOccupant = {
  npcId: "npc_felix_voss",
  visibleIfAll: [{ type: "flag_equals", key: "met_felix_intro", value: true }],
};

const ELEONORA: VnHubZoneOccupant = {
  npcId: "npc_eleonora_voss",
  visibleIfAny: [
    { type: "flag_equals", key: "met_mother_intro", value: true },
    { type: "flag_equals", key: "noticed_eleonora_ring_removed", value: true },
  ],
};

const ALWAYS_VISIBLE: VnHubZoneOccupant = {
  npcId: "npc_lotte_voss",
};

describe("evaluateOccupants", () => {
  it("returns an empty array when occupants is undefined", () => {
    expect(evaluateOccupants(undefined, {}, {})).toEqual([]);
  });

  it("flags occupants whose visibleIfAll group is unsatisfied", () => {
    const result = evaluateOccupants([FELIX], {}, {});
    expect(result).toHaveLength(1);
    expect(result[0].visible).toBe(false);
  });

  it("flags occupants whose visibleIfAll group is satisfied", () => {
    const result = evaluateOccupants([FELIX], { met_felix_intro: true }, {});
    expect(result[0].visible).toBe(true);
  });

  it("treats visibleIfAny as a disjunction", () => {
    expect(evaluateOccupants([ELEONORA], {}, {})[0].visible).toBe(false);
    expect(
      evaluateOccupants(
        [ELEONORA],
        { noticed_eleonora_ring_removed: true },
        {},
      )[0].visible,
    ).toBe(true);
  });

  it("collects only currently visible npcIds", () => {
    const visible = collectVisibleOccupantNpcIds(
      { occupants: [FELIX, ELEONORA, ALWAYS_VISIBLE] },
      { met_felix_intro: true },
      {},
    );
    expect(visible).toEqual(["npc_felix_voss", "npc_lotte_voss"]);
  });
});
