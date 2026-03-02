---
id: tpl_character
tags:
  - type/template
---

# Template Character

```md
---
id: char_{snake_name}
tags: [character, { tier }]
tier: major | functional | generic
faction: null
---

# {Display Name}

## Dossier

- **Role**:
- **Age / Appearance**:
- **Archetype**:
- **Origin**:

## Psyche Profile (Parliament Perception)

| Voice      | Reaction                          | Threshold |
| ---------- | --------------------------------- | --------- |
| Logic      | "Sees a gap in their timeline."   | 8         |
| Empathy    | "Detects fear beneath composure." | 6         |
| Perception | "Spots a physical tell."          | 10        |

## Secrets

- **Surface**: What everybody knows.
- **Hidden**: What investigation can reveal.
- **Core**: What only a specific Voice can unlock.

## Relationships

- [[30_World_Intel/Characters/char_{other}|char_{other}]] - relationship type and tension.
- Factions: [[30_World_Intel/Factions/faction_{id}|faction_{id}]]

## Evolution

- **Stage 1** (start): baseline behavior and key lines.
- **Stage 2** (after clue X): change in tactics/stance.
- **Stage 3** (finale): resolved or collapsed arc.

## Scenes & Quests

- Appears in: [[10_Narrative/Scenes/node_{id}|node_{id}]]
- Linked quest: [[00_Map_Room/qst_{id}|qst_{id}]]
```
