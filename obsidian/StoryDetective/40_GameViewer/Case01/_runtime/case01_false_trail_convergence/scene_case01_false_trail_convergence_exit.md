---
id: scene_case01_false_trail_convergence_exit
type: vn_scene
status: active
---

# Warehouse Address

## Script

The conclusion changes the city map. You are no longer searching for the owner
of a single clue. You are looking for the only person who could make social
noise, postal authority, material science, and an occult target obey one
schedule. The warehouse is not merely a destination now. It is the next line in
the calculation.

```vn-logic
terminal: true
on_enter:
  - set_flag(false_trail_convergence_complete,true)
  - unlock_group(loc_freiburg_warehouse)
choices: []
```
