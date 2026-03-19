import { describe, expect, it } from "vitest";

import { CANONICAL_FACTION_REGISTRY } from "../../../data/factionContract";
import { buildPsycheProfile } from "./psycheProfile";

describe("buildPsycheProfile", () => {
  it("caps daylight scoring to the strongest two public factions", () => {
    const profile = buildPsycheProfile({
      flags: {},
      vars: {},
      factionCatalog: CANONICAL_FACTION_REGISTRY,
      factionSignals: [
        { factionId: "city_chancellery", value: 30 },
        { factionId: "masters_union", value: 29 },
        { factionId: "college_of_reason", value: 28 },
        { factionId: "chapter_of_mercy", value: 27 },
        { factionId: "city_network", value: 35 },
        { factionId: "free_yards", value: 34 },
      ],
    });

    expect(profile.alignment.tier).toBe("shadow");
  });

  it("prefers canonical layer data over legacy fallback", () => {
    const profile = buildPsycheProfile({
      flags: {},
      vars: {
        rep_civic: 40,
        rep_finance: 14,
        rep_underworld: 13,
      },
      factionCatalog: CANONICAL_FACTION_REGISTRY,
      factionSignals: [{ factionId: "city_chancellery", value: 12 }],
    });

    expect(profile.alignment.tier).toBe("contested");
  });

  it("ignores hidden and negative signals for alignment", () => {
    const profile = buildPsycheProfile({
      flags: {},
      vars: {},
      factionCatalog: CANONICAL_FACTION_REGISTRY,
      factionSignals: [
        { factionId: "the_returned", value: 100 },
        { factionId: "city_network", value: -30 },
        { factionId: "free_yards", value: -25 },
        { factionId: "house_of_pledges", value: 12 },
      ],
    });

    expect(profile.alignment.tier).toBe("political");
  });

  it("adds provenance copy when a faction is revealed by pressure", () => {
    const profile = buildPsycheProfile({
      flags: {},
      vars: {},
      factionCatalog: CANONICAL_FACTION_REGISTRY,
      factionSignals: [{ factionId: "house_of_pledges", value: -18 }],
      revealedFactionIds: ["house_of_pledges"],
      revealedFactionReasons: { house_of_pledges: "pressure" },
    });

    expect(profile.factionSignals[0]?.provenanceNote).toBe(
      "You have already felt this milieu pressing on the case.",
    );
  });
});
