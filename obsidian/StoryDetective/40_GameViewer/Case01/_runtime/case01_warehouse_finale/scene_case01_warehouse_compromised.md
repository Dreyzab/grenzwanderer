---
id: scene_case01_warehouse_compromised
type: vn_scene
status: active
---

# Scene: Compromised Truth

## Script

You close the visible case, but only by leaving the bureau thread alive enough
to watch. Galdermann becomes the public culprit, the network goes to ground,
and the University connection is now the only doorway that still opens forward.

```vn-logic
terminal: true
on_enter:
  - set_flag(case_resolved,true)
  - set_flag(case01_resolved_compromise,true)
  - set_flag(case02_hook_university_network,true)
  - set_var(case01_final_outcome,2)
  - grant_xp(25)
choices: []
```
