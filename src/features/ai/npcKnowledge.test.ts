import { describe, expect, it } from "vitest";
import {
  knowledgeConditionHolds,
  knownFactsForCharacter,
} from "./npcKnowledge";

const noFlags = { activeFlags: new Set<string>() };

describe("knowledgeConditionHolds", () => {
  it("resolves always / never", () => {
    expect(knowledgeConditionHolds("always", noFlags)).toBe(true);
    expect(knowledgeConditionHolds("never", noFlags)).toBe(false);
  });

  it("resolves flag: against active flags", () => {
    const state = {
      activeFlags: new Set(["flag_witch_knows_bureau_holds_sasha"]),
    };
    expect(
      knowledgeConditionHolds(
        "flag:flag_witch_knows_bureau_holds_sasha",
        state,
      ),
    ).toBe(true);
    expect(knowledgeConditionHolds("flag:flag_absent", state)).toBe(false);
  });

  it("compares phases by order, failing closed when phase is absent", () => {
    expect(
      knowledgeConditionHolds("phase >= investigation", {
        ...noFlags,
        phase: "bank",
      }),
    ).toBe(true);
    expect(
      knowledgeConditionHolds("phase >= bank", {
        ...noFlags,
        phase: "arrival",
      }),
    ).toBe(false);
    expect(knowledgeConditionHolds("phase >= bank", noFlags)).toBe(false);
  });

  it("fails closed on unrecognized grammar", () => {
    expect(knowledgeConditionHolds("sometimes", noFlags)).toBe(false);
  });
});

describe("knownFactsForCharacter", () => {
  it("returns [] for a character with no matrix entry", () => {
    expect(knownFactsForCharacter("npc_nobody", noFlags)).toEqual([]);
  });

  it("returns the always-known facts of a matrixed character", () => {
    // End-to-end against the compiled matrix: Sasha holds his secret from the start.
    const facts = knownFactsForCharacter("npc_sasha_hartmann_servant", noFlags);
    expect(facts).toContain("ev_sasha_narodnaya_volya");
  });

  it("gates a flag-conditional fact and honors never (Lotte)", () => {
    const without = knownFactsForCharacter("npc_weber_dispatcher", noFlags);
    expect(without).not.toContain("ev_eleonora_uncanny_nature");
    expect(without).not.toContain("ev_sasha_narodnaya_volya");

    const withFlag = knownFactsForCharacter("npc_weber_dispatcher", {
      activeFlags: new Set(["flag_witch_lotte_noticed_strangeness"]),
    });
    expect(withFlag).toContain("ev_eleonora_uncanny_nature");
    // `never` stays false regardless of flags.
    expect(withFlag).not.toContain("ev_sasha_narodnaya_volya");
  });
});
