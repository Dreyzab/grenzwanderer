---
id: scene_case_missing_courier_debrief_partial
type: vn_scene
status: active
---

# Scene: Debrief - Time-Pressure Transfer

## Script

You cannot prove every hand in the chain, but the route break is clear enough: the
papers were redirected to a group preparing a city hall intrusion. The courier's
intent remains disputed, and the bureau signs an emergency follow-up order instead of
a clean prosecution brief.

```vn-logic
terminal: true
on_enter:
  - set_flag(case_missing_courier_resolved,true)
  - set_flag(case_missing_courier_resolved_partial,true)
  - set_flag(case_cityhall_infiltration_unlocked,true)
  - set_flag(cityhall_infiltration_time_pressure,true)
  - set_flag(mayor_grimoire_thread_known,true)
  - set_var(case_missing_courier_outcome,2)
  - grant_xp(20)
choices: []
```
