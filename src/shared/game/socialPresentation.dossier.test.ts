import { describe, expect, it } from "vitest";
import { buildNpcDossierEntries } from "./socialPresentation";
import type { SocialCatalogSnapshot } from "../../features/vn/types";

const baseCatalog = (): SocialCatalogSnapshot => ({
  factions: [],
  services: [],
  rumors: [],
  careerRanks: [],
  npcIdentities: [
    {
      id: "npc_a",
      displayName: "Zelda Vane",
      factionId: "f",
      publicRole: "Operator",
      rosterTier: "major",
      introFlag: "met_a",
      bio: {
        summary: "Always-on summary.",
        stages: [
          { revealFlag: "deep_a", heading: "Hidden", text: "Secret unlocked." },
          { heading: "Open", text: "No gate, always shown once met." },
        ],
      },
    },
    {
      id: "npc_b",
      displayName: "Anna Mahler",
      factionId: "f",
      publicRole: "Fixer",
      rosterTier: "major",
      introFlag: "met_b",
      bio: { summary: "B summary." },
    },
    {
      id: "npc_no_bio",
      displayName: "Ghost",
      factionId: "f",
      publicRole: "None",
      rosterTier: "functional",
      introFlag: "met_ghost",
    },
  ],
});

const emptyLookup = new Map<string, number>();

describe("buildNpcDossierEntries", () => {
  it("excludes NPCs that have not been met", () => {
    const entries = buildNpcDossierEntries(
      baseCatalog(),
      {},
      emptyLookup,
      emptyLookup,
    );
    expect(entries).toHaveLength(0);
  });

  it("excludes met NPCs that have no bio", () => {
    const entries = buildNpcDossierEntries(
      baseCatalog(),
      { met_ghost: true },
      emptyLookup,
      emptyLookup,
    );
    expect(entries.find((e) => e.id === "npc_no_bio")).toBeUndefined();
  });

  it("shows summary + ungated stage but keeps flagged stage locked until its flag is set", () => {
    const entries = buildNpcDossierEntries(
      baseCatalog(),
      { met_a: true },
      emptyLookup,
      emptyLookup,
    );
    const a = entries.find((e) => e.id === "npc_a")!;
    expect(a.summary).toBe("Always-on summary.");
    expect(a.revealedStages.map((s) => s.heading)).toEqual(["Open"]);
    expect(a.lockedStageCount).toBe(1);
  });

  it("reveals a flagged stage once its reveal flag is set", () => {
    const entries = buildNpcDossierEntries(
      baseCatalog(),
      { met_a: true, deep_a: true },
      emptyLookup,
      emptyLookup,
    );
    const a = entries.find((e) => e.id === "npc_a")!;
    expect(a.revealedStages.map((s) => s.heading)).toEqual(["Hidden", "Open"]);
    expect(a.lockedStageCount).toBe(0);
  });

  it("treats trust presence as having met the NPC even without the intro flag", () => {
    const trust = new Map<string, number>([["npc_b", 10]]);
    const entries = buildNpcDossierEntries(
      baseCatalog(),
      {},
      trust,
      emptyLookup,
    );
    expect(entries.map((e) => e.id)).toContain("npc_b");
  });

  it("sorts entries alphabetically by display name", () => {
    const entries = buildNpcDossierEntries(
      baseCatalog(),
      { met_a: true, met_b: true },
      emptyLookup,
      emptyLookup,
    );
    expect(entries.map((e) => e.displayName)).toEqual([
      "Anna Mahler",
      "Zelda Vane",
    ]);
  });
});
