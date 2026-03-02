---
id: tpl_location
tags:
  - type/template
---

# Template Location

```md
---
id: loc_{name}
aliases: ["Display Name", "legacy_loc_id"]
tags:
  - type/location
  - layer/freiburg_1905
  - status/seed
---

# {Display Name}

## Data Binding

- map point id: `loc_{name}`
- source file: `apps/server/src/scripts/data/case_01_points.ts`
- category: `INTEREST | CRIME_SCENE | NPC | QUEST | BUREAU | SUPPORT`

## Atmosphere (Sensory)

- **Sight**:
- **Sound**:
- **Smell**:
- **Light**:
- **Mood**:

## Phase Variations

| Phase   | Description | Available NPCs | Restrictions |
| ------- | ----------- | -------------- | ------------ |
| morning |             |                |              |
| day     |             |                |              |
| evening |             |                |              |
| night   |             |                |              |

## Historical Context (Freiburg 1905)

<!-- Add one real historical anchor tied to this district/building type. -->

## Investigation Hooks

- Passive checks:
- Clue anchors:
- Linked node(s): [[10_Narrative/Scenes/node_{id}|node_{id}]]
```
