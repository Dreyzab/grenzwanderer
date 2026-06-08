# Character Concept

This is the character bible for Grenzwanderer. It sits alongside
[Atmosphere Bible](./ATMOSPHERE_BIBLE.md) (how scenes read) and
[Visual Architecture](./VISUAL_ARCHITECTURE.md) (how scenes look). This document
defines **what a character is** across the whole project and how its layers stay
in agreement.

It is design + production guidance. It does **not** add runtime schema. The one
machine-readable piece it introduces — the narrative-role registry — is a
design-only module (`src/features/vn/characterRoles.ts`), never extracted into
the VN snapshot or the client.

## Core Principle: One Person, Five Contracts

A character is not a single object. It is **one person expressed through five
layers**, each with its own home in the codebase. The art of the system is
keeping all five in agreement for the same person.

| #   | Layer                | Question it answers                                  | Home of record                                                                       |
| --- | -------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | **Identity spine**   | Who is this, technically?                            | `socialCatalog.npcIdentities` (`npc_*`) in `scripts/data/freiburg_social_catalog.ts` |
| 2   | **Narrative role**   | What function does this serve in the story?          | `src/features/vn/characterRoles.ts` (design-only)                                    |
| 3   | **Roster tier**      | How much production does this earn?                  | `NpcRuntimeIdentity.rosterTier` (`major` / `functional` / `archetype`)               |
| 4   | **Visual identity**  | What does this look like, and what must never drift? | `src/features/vn/characterSprites.ts` identity sheet + portrait + CG                 |
| 5   | **Player knowledge** | What does the player learn, and when?                | `## Player Dossier` → `NpcBio` (progressive, flag-gated)                             |

### The identity spine

There is no single canonical character registry; five overlapping id spaces
exist and are reconciled by string matching (see the
`character-id-namespaces` project memory and `docs/CHARACTER_BRIDGE_LEDGER.md`).
**`socialCatalog.npcIdentities` (`npc_*`) is the de-facto spine** — it is the
reliable runtime roster that drives contacts, portraits, trust, and "met" state.
The sprite catalog (`characterSprites.ts`) and the role registry both key on it.

New characters bind here first. The player protagonist (`detective`) is the
single intentional exception: a player anchor, not a contact.

## Layer 2: The Role Grammar

Characters occupy **functions**, not just names. The same grammar is reused
across cases. A character carries **one dominant public role** (what the player
meets first) and **optionally one hidden role** (what investigation reveals). The
public/hidden split maps directly onto the Player Dossier's progressive reveal.

### Surface roles (first meeting)

- **`player_anchor`** — the investigator the player inhabits.
- **`patron_arranger`** — never commands; arranges inevitability through
  obligation (Eleonora: "arranges inevitability, remembers every door she
  opens").
- **`information_contact`** — sells or grants access to knowledge (switchboard,
  archives, occult protocol).
- **`support_ally`** — works alongside the detective; carries trust.
- **`respectable_surface`** — a culprit or threat wearing a legitimate, courteous
  face. The mask, not the guilt.

### Structural roles (revealed — or the public face of a minor suspect)

- **`culprit_by_signature`** — guilt through the pen, not the hands. The crime
  passes through ink and authorization (Galdermann: "the pen, not the crowbar").
- **`culprit_by_act`** — guilt through the physical act (Stoll: the thermite).
- **`false_center`** — noisy and technically culpable, but not the knife (Roth).
- **`noise_false_trail`** — used, not malicious; a professional mark that frames
  others (Anton Weber's twine, Rudi Kempf's protest).
- **`contracted_fist`** — low-level hired muscle, outside the core (Krebs Mugger).
- **`mirror`** — the road-not-taken twin of a culprit; carries a hook into a
  later case (Vossler → Case 02).
- **`concealed_threat`** — a dangerous true nature hidden under a benign surface
  (Eleonora the witch beneath the patron).
- **`negative_space`** — felt only through consequence, never rendered (the
  Architect).

### Composition rule

> One dominant public role, at most one hidden role.

Pure single-role characters are allowed, but the strongest characters are
composite: the contrast between surface and hidden role _is_ their drama.
Eleonora (`patron_arranger` ▸ `concealed_threat`) and Lotte
(`information_contact` ▸ `noise_false_trail`) are the model.

### Split guilt — signature vs act (recurring, not mandatory)

The strongest structural device in Case 01 is **split guilt**: the one who
_signed/authorized_ (`culprit_by_signature`) and the one who _acted by hand_
(`culprit_by_act`) are different people, shielded by `noise_false_trail`
characters. This makes the moral target a chain of approvals, not a single
monster — exactly the Atmosphere Bible's "something morally rotten being filed,
polished, excused."

It is a **signature device, allowed to dominate a case, but not required in
every case.** It is one instrument in the arsenal, not the spine of the series.

### Negative space — strict quota

`negative_space` antagonists (felt, never rendered) are powerful but spoil with
repetition. Hard rule:

> At most **one** `negative_space` antagonist per arc, and it **must** thread a
> narrative line into the next case.

The Architect satisfies this: no portrait, no sprite, no contact render — only
forged orders, target precision, and Stoll's reflexive obedience, pulling toward
the university line.

## Layer 3 ↔ 4: Roster Tier Drives Sprite Budget (only)

Roster tier governs **how much sprite production a character earns** — nothing
else. It does **not** gate CG (see Grill gates below).

| Roster tier      | Portrait      | Sprite + emotions                                        | Example                                           |
| ---------------- | ------------- | -------------------------------------------------------- | ------------------------------------------------- |
| `major`          | yes           | full matrix (7 shared emotions + per-character specials) | Eleonora, Lotte, Galdermann, Stoll                |
| `functional`     | yes           | base set (shared emotions, no specials)                  | Sasha, Roth, Bureau Master                        |
| `archetype`      | optional      | `body_base` only, or 1–2 key emotions                    | low-tier extras                                   |
| design-only      | none          | none                                                     | the 32 background archetypes in the bridge ledger |
| `negative_space` | **forbidden** | **forbidden**                                            | the Architect                                     |

This turns "163 missing sprite entries" from a wall into a **priority queue**:
majors get the full matrix first; archetypes get the floor.

## Layer 5: Player Knowledge

What the player learns ships through `## Player Dossier` in `char_*.md`, extracted
into `NpcBio.stages` and revealed by real progression flags. **Spoiler policy:**
only `## Player Dossier` ships; Secrets / Evolution / Psyche stay design-only in
Obsidian. A character's hidden role (Layer 2) should be revealed here, gated by
the flag that earns it — never visible at first meeting.

## Grill Gates

### Sprite gate (does this character earn a sprite?)

1. Does the player meet this character on screen in a `split` scene? If never
   on screen, it is design-only or `negative_space`, not a sprite.
2. Is its identity bound on the spine (`socialCatalog`) and given an identity
   sheet with `forbiddenDrift`?
3. Does its roster tier match its sprite budget (major → full matrix; archetype →
   floor)?

### CG gate (does this _beat_ earn a fullscreen CG?)

CG is a property of the **moment**, not the character's tier. A `functional`
culprit's confession can earn the case's biggest CG.

1. What does this beat change — relationship, danger, identity, plot turn — that a
   `split` scene could not carry?
2. Is the beat rare enough that a CG stays a punch, not wallpaper?
3. Does the CG honor the character's identity sheet (silhouette, age read, face,
   hair, costume, palette, forbidden drift)?
4. Could a T2 composite (richer `split` background) do the job for a fraction of
   the cost?

If a beat fails 1–2, it is a `split` scene. If 4 is "yes," build T2 instead.

## Completeness Invariant

For every on-screen (sprite-visible) character, all of these must hold, and are
checked by `auditCharacterConcept` (`src/features/vn/characterConcept.ts`, run in
`characterConcept.test.ts`):

- bound on the spine (`socialCatalog`) — except the `player_anchor`;
- has a sprite identity sheet (`characterSprites.ts`);
- has a narrative-role assignment (`characterRoles.ts`);
- if `major`, has a Player Dossier bio.

And the inverse: a `negative_space` character must have **no** sprite plan and
must **not** appear in the visible roster.

## Boundaries

- The narrative-role registry is design-only — never add it to the VN snapshot,
  parser whitelist, or `NpcRuntimeIdentity`.
- Sprite/CG/role data is presentation and authoring metadata; it never mutates
  game state.
- A sprite-visible character missing a spine binding, identity sheet, or role is
  a build error, not a style note.
