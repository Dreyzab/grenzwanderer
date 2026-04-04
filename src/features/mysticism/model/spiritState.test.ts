import { describe, expect, it } from "vitest";
import {
  buildSpiritRoster,
  deriveSpiritStateFromFlags,
  deriveSpiritMethod,
  hasControlledSpiritOfArchetype,
  resolveControlledSpiritModifiers,
  resolveObservationSignatureBonus,
} from "./spiritState";
import type { VnSnapshot } from "../../vn/types";

const snapshotWithSpirits: VnSnapshot = {
  schemaVersion: 7,
  scenarios: [],
  nodes: [],
  mindPalace: {
    cases: [],
    facts: [],
    hypotheses: [],
  },
  mysticism: {
    entityArchetypes: [
      {
        id: "echo_hound",
        label: "Echo Hound",
        veilLevel: 2,
        signatures: ["cold", "echo"],
        habitats: ["rail"],
        temperament: "tracking",
        witnessValue: 2,
        rationalCoverStories: ["stray dog"],
        allowedManifestations: ["trace"],
      },
    ],
    observations: [],
    spiritEncounters: [
      {
        id: "spirit_rail_poltergeist",
        entityArchetypeId: "echo_hound",
        displayName: "Rail Poltergeist",
        subjugationDifficulty: 14,
        observationBonusPerSignature: 2,
        battleScenarioId: "spirit_poltergeist_weak",
        onSubjugateEffects: [{ type: "shift_awakening", amount: 5 }],
        onDestroyEffects: [{ type: "shift_awakening", amount: 10 }],
        imprisonmentItemId: "containment_vessel",
        controlledBonuses: [
          { type: "skill_modifier", voiceId: "occultism", delta: 2 },
          { type: "psyche_read", targetNpcId: "npc_krebs" },
        ],
      },
    ],
  },
};

describe("spiritState model", () => {
  it("derives hostile by default when no flags exist", () => {
    const state = deriveSpiritStateFromFlags("spirit_rail_poltergeist", {});
    expect(state).toBe("hostile");
  });

  it("derives controlled when controlled flag is set", () => {
    const state = deriveSpiritStateFromFlags("spirit_rail_poltergeist", {
      "spirit_state_spirit_rail_poltergeist::controlled": true,
    });
    expect(state).toBe("controlled");
  });

  it("destroyed takes priority over controlled", () => {
    const state = deriveSpiritStateFromFlags("spirit_rail_poltergeist", {
      "spirit_state_spirit_rail_poltergeist::controlled": true,
      "spirit_state_spirit_rail_poltergeist::destroyed": true,
    });
    expect(state).toBe("destroyed");
  });

  it("derives subjugation method from flags", () => {
    expect(
      deriveSpiritMethod("spirit_rail_poltergeist", {
        "spirit_method_spirit_rail_poltergeist::dialogue": true,
      }),
    ).toBe("dialogue");

    expect(
      deriveSpiritMethod("spirit_rail_poltergeist", {
        "spirit_method_spirit_rail_poltergeist::battle": true,
      }),
    ).toBe("battle");

    expect(deriveSpiritMethod("spirit_rail_poltergeist", {})).toBeNull();
  });

  it("builds spirit roster from snapshot and flags", () => {
    const roster = buildSpiritRoster(snapshotWithSpirits, {
      "spirit_state_spirit_rail_poltergeist::controlled": true,
      "spirit_method_spirit_rail_poltergeist::dialogue": true,
    });

    expect(roster).toHaveLength(1);
    expect(roster[0]).toMatchObject({
      id: "spirit_rail_poltergeist",
      displayName: "Rail Poltergeist",
      state: "controlled",
      method: "dialogue",
    });
    expect(roster[0].controlledBonuses).toHaveLength(2);
  });

  it("returns empty controlledBonuses for non-controlled spirits", () => {
    const roster = buildSpiritRoster(snapshotWithSpirits, {});
    expect(roster[0].state).toBe("hostile");
    expect(roster[0].controlledBonuses).toHaveLength(0);
  });

  it("resolves controlled spirit VnCheckModifiers", () => {
    const modifiers = resolveControlledSpiritModifiers(snapshotWithSpirits, {
      "spirit_state_spirit_rail_poltergeist::controlled": true,
    });

    expect(modifiers).toHaveLength(1);
    expect(modifiers[0]).toMatchObject({
      source: "trait",
      sourceId: "spirit::spirit_rail_poltergeist",
      delta: 2,
    });
  });

  it("returns no modifiers when no spirits are controlled", () => {
    const modifiers = resolveControlledSpiritModifiers(snapshotWithSpirits, {});
    expect(modifiers).toHaveLength(0);
  });

  it("detects controlled spirit by archetype", () => {
    expect(
      hasControlledSpiritOfArchetype(
        snapshotWithSpirits,
        { "spirit_state_spirit_rail_poltergeist::controlled": true },
        "echo_hound",
      ),
    ).toBe(true);

    expect(
      hasControlledSpiritOfArchetype(snapshotWithSpirits, {}, "echo_hound"),
    ).toBe(false);
  });

  it("calculates observation signature bonus", () => {
    const encounter = snapshotWithSpirits.mysticism!.spiritEncounters![0];

    const bonus = resolveObservationSignatureBonus(encounter, {
      mystic_signature_cold: true,
      mystic_signature_echo: true,
    });
    expect(bonus).toBe(4); // 2 signatures × 2 per signature

    const noBonus = resolveObservationSignatureBonus(encounter, {});
    expect(noBonus).toBe(0);
  });
});
