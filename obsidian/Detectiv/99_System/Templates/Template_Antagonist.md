---
id: tpl_antagonist
tags:
  - type/template
---

# Template Antagonist

Extends `Template_Character` for opponents, culprits, and pressure figures.
Keep the base Character sections (Dossier / Psyche / Secrets / Relationships /
Evolution / Scenes), and add the antagonist-specific sections below. Honor
`docs/ATMOSPHERE_BIBLE.md`: darkness is *earned*, the surface stays respectable,
and most antagonists are functionaries, not monsters.

```md
---
id: char_{snake_name}
tags: [character, { tier }, antagonist]
tier: major | functional | generic
runtime_character_id: { role_key }
design_only: true
faction: { faction_id }
aliases: ["{Public Name}", "{Codename}"]
---

# {Display Name} ("{Codename}")

## Dossier

- **Role**:
- **Age / Appearance**:
- **Archetype**:
- **Origin**:

## Function in Crime

- **Function**: planner | executor | cover | false-trail | enabler
- **Not**: (what this character is explicitly NOT responsible for — protect the
  real mastermind and any off-screen reveal)
- **Contribution to the theatre**: (the one specific thing they add to the staged
  crime — noise, movement, precision, paperwork, an alibi)

## Motivation & Justification

- **Lever**: (debt, blackmail, loyalty, ideology, money — why they can be moved)
- **Self-justification**: (the story they tell themselves so they can sleep)
- **Mastermind hook**: (the tell that points past them to someone above; keep the
  mastermind unnamed if the case requires it)
- **Moral weight (earned darkness)**: (where the rot actually is — usually an
  institution or relationship misused, not personal cruelty)

## Psyche Profile (Parliament Perception)

| Voice | Reaction | Threshold |
| ----- | -------- | --------- |
| Logic | "" | 8 |
| Empathy | "" | 6 |
| Perception | "" | 7 |

## Secrets

- **Surface**: What everybody knows.
- **Hidden**: What investigation can reveal.
- **Core**: What only a specific Voice/route can unlock (name the gate).

## Exposure Path

- **{clue} -> {Voice}**: what it proves and what it does NOT prove yet.
- (one line per evidence layer, ending at motive/mastermind)

## Confrontation Modes

- **Violent**: stands and fights / forces a hard close.
- **Negotiated**: trades testimony or a name for a quieter exit.
- **Lawful**: collapses into confession / is taken by warrant.
- (note which flags or routes gate each)

## Visibility

- on-screen | shadow | flashback-only | named-but-absent
- (when the face is revealed, if ever — supports staged reveals)

## Relationships

- [[30_World_Intel/Characters/char_{other}|char_{other}]] - relationship and tension.
- {Mastermind} - off-screen handler, named nowhere (if applicable).
- Factions: [[00_Map_Room/MOC_Factions|MOC_Factions]]

## Evolution

- **Stage 1** (start): baseline / phantom.
- **Stage 2** (after clue X): named role, not yet face.
- **Stage 3** (finale): resolved via a Confrontation Mode.

## Visual Direction

- (silhouette, disguise tells, what to reveal last)

## Scenes & Quests

- Appears in: [[10_Narrative/Scenes/node_{id}|node_{id}]]
- Roster: [[00_Map_Room/MOC_Antagonists|MOC_Antagonists]]
- Linked quest: [[00_Map_Room/qst_{id}|qst_{id}]]

## Runtime Promotion Notes

- (design_only checklist: identity axis, portrait/sprite, scene wiring, bridge check)
```
