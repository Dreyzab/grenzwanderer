import { describe, expect, it } from "vitest";
import {
  buildBridgeFindings,
  candidateIds,
  resolveRuntimeCharacterId,
  validateKnowsCondition,
  type CharNote,
  type RuntimeRegistries,
} from "./character-bridge-core";

const registries: RuntimeRegistries = {
  socialNpcs: [
    {
      id: "npc_weber_dispatcher",
      displayName: "Lotte Weber",
      rosterTier: "major",
    },
    { id: "npc_anna_mahler", displayName: "Anna Mahler", rosterTier: "major" },
  ],
  locationCastIds: ["npc_kessler_banker"],
  resolvesInAssets: (candidate) => candidate === "enforcer",
};

const note = (overrides: Partial<CharNote>): CharNote => ({
  fileId: "char_x",
  vault: "Detectiv",
  relativePath: "obsidian/Detectiv/30_World_Intel/Characters/char_x.md",
  aliases: [],
  ...overrides,
});

describe("candidateIds", () => {
  it("produces normalized, npc-stripped, and npc-prefixed variants", () => {
    expect(candidateIds("Bank-Manager")).toEqual([
      "bank_manager",
      "npc_bank_manager",
    ]);
    expect(candidateIds("npc_weber_dispatcher")).toEqual([
      "npc_weber_dispatcher",
      "weber_dispatcher",
      "npc_npc_weber_dispatcher",
    ]);
  });
});

describe("resolveRuntimeCharacterId", () => {
  it("resolves a socialCatalog id directly", () => {
    expect(
      resolveRuntimeCharacterId("npc_weber_dispatcher", registries).registry,
    ).toBe("socialCatalog");
  });

  it("resolves via the npc_ prefix variant (speaker-style id)", () => {
    const result = resolveRuntimeCharacterId("weber_dispatcher", registries);
    expect(result.registry).toBe("socialCatalog");
    expect(result.socialNpc?.id).toBe("npc_weber_dispatcher");
  });

  it("falls back to location cast, then assets, then null", () => {
    expect(
      resolveRuntimeCharacterId("kessler_banker", registries).registry,
    ).toBe("locationCast");
    expect(resolveRuntimeCharacterId("enforcer", registries).registry).toBe(
      "characterAssets",
    );
    expect(
      resolveRuntimeCharacterId("ghost_role", registries).registry,
    ).toBeNull();
  });
});

describe("buildBridgeFindings", () => {
  it("flags unresolved runtime ids as warnings", () => {
    const findings = buildBridgeFindings(
      [note({ runtimeCharacterId: "ghost_role" })],
      registries,
    );
    expect(findings.some((f) => f.category === "unresolved-runtime-id")).toBe(
      true,
    );
  });

  it("resolves via npc_identity even when runtime_character_id is a non-resolving speaker key", () => {
    // The Felix case: runtime_character_id 'partner' (speaker role) does not
    // resolve, but npc_identity binds the note to a real contact.
    const findings = buildBridgeFindings(
      [
        note({
          fileId: "char_partner",
          runtimeCharacterId: "partner",
          npcIdentity: "npc_anna_mahler",
          displayName: "Anna Mahler",
        }),
      ],
      registries,
    );
    expect(findings.some((f) => f.category === "unresolved-runtime-id")).toBe(
      false,
    );
    // npc_anna_mahler is now covered, so it is not reported missing.
    expect(
      findings.some(
        (f) =>
          f.category === "missing-dossier" && f.subject === "npc_anna_mahler",
      ),
    ).toBe(false);
  });

  it("reports a design_only unresolved note as info, not a warning", () => {
    const findings = buildBridgeFindings(
      [note({ runtimeCharacterId: "ghost_role", designOnly: true })],
      registries,
    );
    expect(findings.some((f) => f.category === "unresolved-runtime-id")).toBe(
      false,
    );
    expect(findings.some((f) => f.category === "design-only-archetype")).toBe(
      true,
    );
  });

  it("does not flag a same-vault duplicate when the whole group is design_only", () => {
    const findings = buildBridgeFindings(
      [
        note({
          fileId: "char_a",
          relativePath: "a.md",
          runtimeCharacterId: "professor",
          designOnly: true,
        }),
        note({
          fileId: "char_b",
          relativePath: "b.md",
          runtimeCharacterId: "professor",
          designOnly: true,
        }),
      ],
      registries,
    );
    expect(
      findings.some((f) => f.category === "duplicate-runtime-id-same-vault"),
    ).toBe(false);
  });

  it("flags name drift when the runtime contact name is absent from the note", () => {
    const findings = buildBridgeFindings(
      [
        note({
          runtimeCharacterId: "npc_weber_dispatcher",
          displayName: "Someone Else",
          aliases: ["Nobody"],
        }),
      ],
      registries,
    );
    expect(findings.some((f) => f.category === "name-drift")).toBe(true);
  });

  it("does not flag name drift when an alias matches the runtime name", () => {
    const findings = buildBridgeFindings(
      [
        note({
          runtimeCharacterId: "npc_weber_dispatcher",
          displayName: "Lotte Weber",
          aliases: ["Red-haired Girl"],
        }),
      ],
      registries,
    );
    expect(findings.some((f) => f.category === "name-drift")).toBe(false);
  });

  it("errors on a same-vault collision that resolves to a real contact", () => {
    const findings = buildBridgeFindings(
      [
        note({
          fileId: "char_a",
          relativePath: "a.md",
          runtimeCharacterId: "npc_anna_mahler",
        }),
        note({
          fileId: "char_b",
          relativePath: "b.md",
          runtimeCharacterId: "npc_anna_mahler",
        }),
      ],
      registries,
    );
    const collision = findings.find(
      (f) => f.category === "duplicate-runtime-id-same-vault",
    );
    expect(collision?.severity).toBe("error");
  });

  it("only warns when a generic/unresolved archetype id is reused in one vault", () => {
    const findings = buildBridgeFindings(
      [
        note({
          fileId: "char_a",
          relativePath: "a.md",
          runtimeCharacterId: "enforcer",
        }),
        note({
          fileId: "char_b",
          relativePath: "b.md",
          runtimeCharacterId: "enforcer",
        }),
      ],
      registries,
    );
    const collision = findings.find(
      (f) => f.category === "duplicate-runtime-id-same-vault",
    );
    expect(collision?.severity).toBe("warn");
  });

  it("warns on cross-vault duplicate dossiers and reports missing major dossiers", () => {
    const findings = buildBridgeFindings(
      [
        note({
          fileId: "char_w",
          vault: "Detectiv",
          relativePath: "d.md",
          runtimeCharacterId: "npc_weber_dispatcher",
          displayName: "Lotte Weber",
        }),
        note({
          fileId: "char_w",
          vault: "StoryDetective",
          relativePath: "s.md",
          runtimeCharacterId: "npc_weber_dispatcher",
          displayName: "Lotte Weber",
        }),
      ],
      registries,
    );
    expect(
      findings.some((f) => f.category === "duplicate-runtime-id-cross-vault"),
    ).toBe(true);
    // npc_anna_mahler (major) has no dossier -> missing.
    expect(
      findings.some(
        (f) =>
          f.category === "missing-dossier" && f.subject === "npc_anna_mahler",
      ),
    ).toBe(true);
  });
});

describe("validateKnowsCondition", () => {
  it("accepts the grammar forms and rejects everything else", () => {
    expect(validateKnowsCondition("always")).toBeNull();
    expect(validateKnowsCondition("never")).toBeNull();
    expect(validateKnowsCondition("phase >= investigation")).toBeNull();
    expect(validateKnowsCondition("flag:flag_witch_shame_revealed")).toBeNull();
    expect(validateKnowsCondition("sometimes")).not.toBeNull();
    expect(validateKnowsCondition("phase ~ bank")).not.toBeNull();
  });
});

describe("knows: knowledge linting", () => {
  it("errors on bad condition grammar and warns on a missing evidence note", () => {
    const findings = buildBridgeFindings(
      [
        note({
          runtimeCharacterId: "npc_weber_dispatcher",
          displayName: "Lotte Weber",
          knows: [
            { fact: "ev_known", condition: "always" },
            { fact: "ev_missing", condition: "always" },
            { fact: "fact_social", condition: "phase >= bank" },
            { fact: "fact_bad", condition: "sometimes" },
          ],
        }),
      ],
      registries,
      new Set(["ev_known"]),
    );
    expect(
      findings.some(
        (f) =>
          f.category === "knowledge-unknown-evidence" &&
          f.detail.includes("ev_missing"),
      ),
    ).toBe(true);
    expect(
      findings.some(
        (f) =>
          f.category === "knowledge-bad-condition" &&
          f.detail.includes("fact_bad"),
      ),
    ).toBe(true);
    // A resolvable ev_* fact and a valid fact_* condition produce no findings.
    expect(findings.some((f) => f.detail.includes("'ev_known'"))).toBe(false);
    expect(
      findings.some(
        (f) =>
          f.category === "knowledge-bad-condition" &&
          f.detail.includes("fact_social"),
      ),
    ).toBe(false);
  });
});
