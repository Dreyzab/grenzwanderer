---
id: scene_case_missing_courier_debrief_success
type: vn_scene
status: active
---

# Scene: Debrief - Full Reconstruction

## Script

The board receives a route map pinned by timestamp, witness signatures, and seal
traces. The courier is recovered alive, shaken but cooperative. Your report names an
internal leak path and confirms the stolen document stream points toward city hall's
restricted archive corridor.

```vn-logic
terminal: true
on_enter:
  - set_flag(case_missing_courier_resolved,true)
  - set_flag(case_missing_courier_resolved_success,true)
  - set_flag(case_cityhall_infiltration_unlocked,true)
  - set_flag(cityhall_infiltration_support_strong,true)
  - set_flag(mayor_grimoire_thread_known,true)
  - set_var(case_missing_courier_outcome,1)
  - grant_xp(25)
choices: []
```
