---
id: scene_case01_archive_exit
type: vn_scene
status: active
---

# Official Entry Ready

## Script

The paperwork is finally sharp enough to cut with. You can hit the warehouse in
daylight and call it lawful when the shouting starts.

```vn-logic
terminal: true
on_enter:
  - set_flag(warrant_ready,true)
  - set_flag(warehouse_plan_locked,true)
  - unlock_group(loc_freiburg_warehouse)
choices: []
```
