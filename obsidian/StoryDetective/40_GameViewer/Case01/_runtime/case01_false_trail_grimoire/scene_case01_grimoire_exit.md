---
id: scene_case01_grimoire_exit
type: vn_scene
status: active
---

# The Book Was A Specification

## Script

Roth is vain, frightened, and useful. He is not the center. The grimoire trail
does not point to an ecstatic cultist but to a planner who needed dimensions,
heat tolerance, extraction time, and a reason to ignore the money in the vault.

```vn-logic
terminal: true
on_enter:
  - set_flag(false_trail_grimoire_complete,true)
  - grant_xp(15)
choices: []
```
