import { describe, expect, it } from "vitest";

import { FREIBURG_SOCIAL_CATALOG } from "../../../scripts/data/freiburg_social_catalog";
import {
  auditCharacterConcept,
  type ConceptCharacterInput,
} from "./characterConcept";
import { CHARACTER_NARRATIVE_ROLES, getCharacterRole } from "./characterRoles";
import {
  CASE01_VISIBLE_SPRITE_CHARACTER_IDS,
  hasCharacterSpritePlan,
} from "./characterSprites";

const CATALOG_BY_ID = new Map(
  FREIBURG_SOCIAL_CATALOG.npcIdentities.map((npc) => [npc.id, npc]),
);

/** Build the audit input from the real five concept layers. */
const buildRealInputs = (): ConceptCharacterInput[] => {
  const visibleInputs = CASE01_VISIBLE_SPRITE_CHARACTER_IDS.map(
    (characterId): ConceptCharacterInput => {
      const identity = CATALOG_BY_ID.get(characterId);
      return {
        characterId,
        isPlayerAnchor: characterId === "detective",
        isVisible: true,
        hasSpritePlan: hasCharacterSpritePlan(characterId),
        inSocialCatalog: identity !== undefined,
        rosterTier: identity?.rosterTier,
        hasDossier: identity?.bio !== undefined,
        role: getCharacterRole(characterId),
      };
    },
  );

  // Include role-registry entries that are intentionally NOT visible (e.g. the
  // Architect) so the negative_space inverse rules are exercised against real data.
  const visibleIds = new Set<string>(CASE01_VISIBLE_SPRITE_CHARACTER_IDS);
  const offscreenInputs = CHARACTER_NARRATIVE_ROLES.filter(
    (role) => !visibleIds.has(role.characterId),
  ).map((role): ConceptCharacterInput => {
    const identity = CATALOG_BY_ID.get(role.characterId);
    return {
      characterId: role.characterId,
      isPlayerAnchor: false,
      isVisible: false,
      hasSpritePlan: hasCharacterSpritePlan(role.characterId),
      inSocialCatalog: identity !== undefined,
      rosterTier: identity?.rosterTier,
      hasDossier: identity?.bio !== undefined,
      role,
    };
  });

  return [...visibleInputs, ...offscreenInputs];
};

describe("character concept completeness audit", () => {
  it("every visible character has a narrative-role assignment", () => {
    for (const characterId of CASE01_VISIBLE_SPRITE_CHARACTER_IDS) {
      expect(getCharacterRole(characterId)).not.toBeNull();
    }
  });

  it("the real roster passes the completeness invariant with no errors", () => {
    const result = auditCharacterConcept(buildRealInputs());
    expect(result.errors).toEqual([]);
  });

  it("keeps the Architect as a bound-out negative space", () => {
    const architect = getCharacterRole("npc_architect");
    expect(architect?.negativeSpace).toBe(true);
    expect(hasCharacterSpritePlan("npc_architect")).toBe(false);
    expect(
      [...CASE01_VISIBLE_SPRITE_CHARACTER_IDS].includes(
        "npc_architect" as never,
      ),
    ).toBe(false);
  });

  it("flags a sprite-visible character missing its spine binding and role", () => {
    const result = auditCharacterConcept([
      {
        characterId: "npc_phantom",
        isPlayerAnchor: false,
        isVisible: true,
        hasSpritePlan: true,
        inSocialCatalog: false,
        rosterTier: undefined,
        hasDossier: false,
        role: null,
      },
    ]);
    const rules = result.errors.map((finding) => finding.rule);
    expect(rules).toContain("missing_spine_binding");
    expect(rules).toContain("missing_role");
  });

  it("flags a major character with no dossier as a warning", () => {
    const result = auditCharacterConcept([
      {
        characterId: "npc_major_no_bio",
        isPlayerAnchor: false,
        isVisible: true,
        hasSpritePlan: true,
        inSocialCatalog: true,
        rosterTier: "major",
        hasDossier: false,
        role: {
          characterId: "npc_major_no_bio",
          displayName: "x",
          public: "support_ally",
        },
      },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.warnings.map((finding) => finding.rule)).toContain(
      "major_missing_dossier",
    );
  });

  it("errors when a negative_space character is rendered or visible", () => {
    const result = auditCharacterConcept([
      {
        characterId: "npc_ghost",
        isPlayerAnchor: false,
        isVisible: true,
        hasSpritePlan: true,
        inSocialCatalog: false,
        rosterTier: undefined,
        hasDossier: false,
        role: {
          characterId: "npc_ghost",
          displayName: "Ghost",
          public: "negative_space",
          negativeSpace: true,
        },
      },
    ]);
    const rules = result.errors.map((finding) => finding.rule);
    expect(rules).toContain("negative_space_has_sprite");
    expect(rules).toContain("negative_space_is_visible");
  });
});
