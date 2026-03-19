import { describe, expect, it } from "vitest";

import {
  ALLOWED_FACTION_IDS,
  CANONICAL_FACTION_REGISTRY,
  getFactionCatalog,
  isAllowedFactionId,
} from "../../../data/factionContract";

describe("factionContract", () => {
  it("returns the canonical registry when no snapshot catalog is present", () => {
    const catalog = getFactionCatalog();

    expect(catalog.map((entry) => entry.id)).toEqual(
      CANONICAL_FACTION_REGISTRY.map((entry) => entry.id),
    );
  });

  it("sorts snapshot faction data back into canonical order", () => {
    const reversed = [...CANONICAL_FACTION_REGISTRY].reverse();
    const catalog = getFactionCatalog({
      socialCatalog: {
        factions: reversed,
      },
    });

    expect(catalog.map((entry) => entry.id)).toEqual(
      CANONICAL_FACTION_REGISTRY.map((entry) => entry.id),
    );
  });

  it("accepts canonical and compatibility ids while rejecting unknown ids", () => {
    for (const factionId of ALLOWED_FACTION_IDS) {
      expect(isAllowedFactionId(factionId)).toBe(true);
    }

    expect(isAllowedFactionId("bogus_faction")).toBe(false);
  });
});
