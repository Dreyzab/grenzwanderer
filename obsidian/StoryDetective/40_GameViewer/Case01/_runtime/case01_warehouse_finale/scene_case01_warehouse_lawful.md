---
id: scene_case01_warehouse_lawful
type: vn_scene
status: active
---

# Scene: Lawful Close

## Script

Galdermann folds when the warrant lands and the archive chain holds. The case
closes in public, the network survives offstage, and the University thread is
all that remains obvious enough to chase next.

```vn-logic
terminal: true
on_enter:
  - set_flag(case_resolved,true)
  - set_flag(case01_resolved_lawful,true)
  - set_flag(case02_hook_university_network,true)
  - set_var(case01_final_outcome,1)
  - grant_xp(25)
choices: []
```
