/**
 * Character Concept completeness audit (design-only).
 *
 * See docs/CHARACTER_CONCEPT.md. Pure function: callers feed the resolved state
 * of each character (spine binding, sprite plan, roster tier, dossier, role) and
 * receive findings. The wiring to real data lives in characterConcept.test.ts so
 * this module stays dependency-free and unit-testable.
 *
 * The invariant: every on-screen (sprite-visible) character is bound on the
 * spine, has an identity sheet, and has a narrative role; majors also carry a
 * Player Dossier. The inverse: a negative_space character has no sprite plan and
 * never appears in the visible roster.
 */

import type { NpcRosterTier } from "./types";
import type { CharacterRoleAssignment } from "./characterRoles";

export type ConceptFindingSeverity = "error" | "warn" | "info";

export type ConceptFindingRule =
  | "missing_spine_binding"
  | "missing_sprite_plan"
  | "missing_role"
  | "major_missing_dossier"
  | "negative_space_has_sprite"
  | "negative_space_is_visible"
  | "negative_space_quota";

export interface ConceptFinding {
  severity: ConceptFindingSeverity;
  characterId: string;
  rule: ConceptFindingRule;
  detail: string;
}

/** Resolved state of one character, gathered from the five concept layers. */
export interface ConceptCharacterInput {
  characterId: string;
  /** True when this is the player protagonist (exempt from the spine binding). */
  isPlayerAnchor: boolean;
  /** Appears in the sprite-visible roster this arc. */
  isVisible: boolean;
  /** Has an identity sheet / sprite plan in characterSprites.ts. */
  hasSpritePlan: boolean;
  /** Bound on the spine (socialCatalog.npcIdentities). */
  inSocialCatalog: boolean;
  /** Roster tier from the spine, when bound. */
  rosterTier?: NpcRosterTier;
  /** Has a Player Dossier / NpcBio. */
  hasDossier: boolean;
  /** Narrative-role assignment from characterRoles.ts. */
  role: CharacterRoleAssignment | null;
}

export interface ConceptAuditResult {
  findings: ConceptFinding[];
  errors: ConceptFinding[];
  warnings: ConceptFinding[];
}

export const auditCharacterConcept = (
  inputs: readonly ConceptCharacterInput[],
): ConceptAuditResult => {
  const findings: ConceptFinding[] = [];

  for (const input of inputs) {
    const isNegativeSpace = input.role?.negativeSpace === true;

    if (isNegativeSpace) {
      if (input.hasSpritePlan) {
        findings.push({
          severity: "error",
          characterId: input.characterId,
          rule: "negative_space_has_sprite",
          detail:
            "negative_space character must not have a sprite plan (felt, never rendered).",
        });
      }
      if (input.isVisible) {
        findings.push({
          severity: "error",
          characterId: input.characterId,
          rule: "negative_space_is_visible",
          detail:
            "negative_space character must not appear in the visible sprite roster.",
        });
      }
      // A negative_space character is intentionally unbound and unrendered;
      // skip the on-screen completeness checks below.
      continue;
    }

    if (!input.isVisible) {
      continue;
    }

    if (!input.role) {
      findings.push({
        severity: "error",
        characterId: input.characterId,
        rule: "missing_role",
        detail:
          "sprite-visible character has no narrative-role assignment in characterRoles.ts.",
      });
    }

    if (!input.hasSpritePlan) {
      findings.push({
        severity: "error",
        characterId: input.characterId,
        rule: "missing_sprite_plan",
        detail:
          "sprite-visible character has no identity sheet / sprite plan in characterSprites.ts.",
      });
    }

    if (!input.isPlayerAnchor && !input.inSocialCatalog) {
      findings.push({
        severity: "error",
        characterId: input.characterId,
        rule: "missing_spine_binding",
        detail:
          "sprite-visible character is not bound on the spine (socialCatalog.npcIdentities).",
      });
    }

    if (input.rosterTier === "major" && !input.hasDossier) {
      findings.push({
        severity: "warn",
        characterId: input.characterId,
        rule: "major_missing_dossier",
        detail: "major-tier character has no Player Dossier / NpcBio.",
      });
    }
  }

  // Arc quota: at most one negative_space antagonist.
  const negativeSpaceIds = inputs
    .filter((input) => input.role?.negativeSpace === true)
    .map((input) => input.characterId);
  if (negativeSpaceIds.length > 1) {
    findings.push({
      severity: "warn",
      characterId: negativeSpaceIds.join(", "),
      rule: "negative_space_quota",
      detail: `more than one negative_space antagonist in this arc: ${negativeSpaceIds.join(", ")}.`,
    });
  }

  return {
    findings,
    errors: findings.filter((finding) => finding.severity === "error"),
    warnings: findings.filter((finding) => finding.severity === "warn"),
  };
};
