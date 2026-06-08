/**
 * Design-only narrative-role registry (Character Concept layer 2).
 *
 * See docs/CHARACTER_CONCEPT.md. This is authoring metadata: it is NOT part of
 * the VN snapshot, the parser whitelist, or NpcRuntimeIdentity, and it never
 * ships to the client. It exists so the role grammar is machine-checkable
 * (completeness audit) instead of living only in prose.
 *
 * A character carries one dominant `public` role (what the player meets first)
 * and at most one optional `hidden` role (what investigation reveals). Hidden
 * roles should surface through the Player Dossier, gated by a progression flag.
 */

/** Surface roles: how a character first presents to the player. */
export const SURFACE_NARRATIVE_ROLES = [
  "player_anchor",
  "patron_arranger",
  "information_contact",
  "support_ally",
  "respectable_surface",
] as const;

/**
 * Structural roles: the function revealed by investigation. For a minor suspect
 * the player meets the structural role directly, so it may also be a `public`
 * role.
 */
export const STRUCTURAL_NARRATIVE_ROLES = [
  "culprit_by_signature",
  "culprit_by_act",
  "false_center",
  "noise_false_trail",
  "contracted_fist",
  "mirror",
  "concealed_threat",
  "negative_space",
] as const;

export const NARRATIVE_ROLES = [
  ...SURFACE_NARRATIVE_ROLES,
  ...STRUCTURAL_NARRATIVE_ROLES,
] as const;

export type NarrativeRole = (typeof NARRATIVE_ROLES)[number];

export interface CharacterRoleAssignment {
  /** Spine id (`npc_*`) or the `detective` player anchor. */
  characterId: string;
  displayName: string;
  /** Dominant role the player meets first. */
  public: NarrativeRole;
  /** Optional single role revealed later (the surface/hidden contrast). */
  hidden?: NarrativeRole;
  /**
   * Felt-only antagonist: must have no sprite plan and must not appear in the
   * visible sprite roster. At most one per arc (see CHARACTER_CONCEPT.md).
   */
  negativeSpace?: boolean;
}

export const CHARACTER_NARRATIVE_ROLES: readonly CharacterRoleAssignment[] = [
  {
    characterId: "detective",
    displayName: "Detective",
    public: "player_anchor",
  },
  {
    characterId: "npc_mother_hartmann",
    displayName: "Eleonora Hartmann",
    public: "patron_arranger",
    hidden: "concealed_threat",
  },
  {
    characterId: "npc_weber_dispatcher",
    displayName: "Lotte Weber",
    public: "information_contact",
    hidden: "noise_false_trail",
  },
  {
    characterId: "npc_sasha_hartmann_servant",
    displayName: 'Alexander "Sasha"',
    public: "support_ally",
  },
  {
    characterId: "npc_felix_hartmann",
    displayName: "Felix Hartmann",
    public: "support_ally",
  },
  {
    characterId: "npc_bureau_master",
    displayName: "The Master",
    public: "information_contact",
    hidden: "concealed_threat",
  },
  {
    characterId: "npc_heinrich_galdermann",
    displayName: "Heinrich Galdermann",
    public: "respectable_surface",
    hidden: "culprit_by_signature",
  },
  {
    characterId: "npc_albrecht_stoll",
    displayName: "Oberleutnant Albrecht Stoll",
    public: "respectable_surface",
    hidden: "culprit_by_act",
  },
  {
    characterId: "npc_emil_roth",
    displayName: "Emil Roth",
    public: "false_center",
  },
  {
    characterId: "npc_krebs_mugger",
    displayName: "Krebs Mugger",
    public: "contracted_fist",
  },
  {
    characterId: "npc_anton_weber",
    displayName: "Anton Weber",
    public: "noise_false_trail",
  },
  {
    characterId: "npc_rudi_kempf",
    displayName: "Rudi Kempf",
    public: "noise_false_trail",
  },
  {
    characterId: "npc_konrad_vossler",
    displayName: "Konrad Vossler",
    public: "mirror",
  },
  {
    characterId: "npc_architect",
    displayName: "The Architect",
    public: "negative_space",
    negativeSpace: true,
  },
] as const;

const CHARACTER_ROLE_BY_ID = new Map(
  CHARACTER_NARRATIVE_ROLES.map((role) => [role.characterId, role]),
);

export const getCharacterRole = (
  characterId: string | undefined,
): CharacterRoleAssignment | null =>
  characterId ? (CHARACTER_ROLE_BY_ID.get(characterId) ?? null) : null;
