---
id: tpl_quest
tags:
  - type/template
---

# Template Quest

```md
---
id: qst_{id}
aliases: []
tags:
  - type/quest
  - status/seed
start_event: evt_{id_start}
end_event: evt_{id_end}
related_scenes: [scene_{id}]
related_locations: [loc_{name}]
---

# [[qst_{id}]]

## Goal

- Player-facing objective:

## Arc

- Start: [[evt_{id_start}]]
- Midpoint:
- End: [[evt_{id_end}]]

## Critical Path

- [[scene_{id_1}]] -> [[scene_{id_2}]] -> [[scene_{id_3}]]

## Rewards and State

- Evidence: `evi_{id}`
- Flags: `flag_{name}`
```
