---
id: scene_case_missing_courier_debrief_compromised
type: vn_scene
status: active
---

# Scene: Debrief - Compromised Record

## Script

The report closes fast and leaks faster. The wrong man is held, the leak chain is
muddy, and city hall counsel challenges your procedure before the ink dries. Even so,
one line survives scrutiny: someone is moving on the archive floor, and you are out
of time to wait for a cleaner warrant.

```vn-logic
terminal: true
on_enter:
  - set_flag(case_missing_courier_resolved,true)
  - set_flag(case_missing_courier_resolved_compromised,true)
  - set_flag(case_cityhall_infiltration_unlocked,true)
  - set_flag(cityhall_infiltration_support_weak,true)
  - set_flag(mayor_grimoire_thread_known,true)
  - set_flag(case_missing_courier_reputation_penalty,true)
  - set_var(case_missing_courier_outcome,3)
  - grant_xp(15)
choices: []
```
