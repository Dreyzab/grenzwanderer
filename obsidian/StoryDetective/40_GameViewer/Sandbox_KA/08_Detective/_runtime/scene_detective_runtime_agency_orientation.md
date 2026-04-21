---
id: scene_detective_runtime_agency_orientation
type: vn_scene
status: active
---

# Scene: Agency Orientation

## Script

Victoria Sterling does not waste your time with pleasantries. She pushes the
bank dossier across the table, already sorted into witness names, timings, and
the first contradictions.

```vn-logic
on_enter:
  - set_flag(detective_prologue_done,true)
choices:
  - id: DETECTIVE_ACCEPT_CASE
    text: Take the bank file
    next: scene_detective_runtime_case01_arrival
    visible_if_all:
      - and(flag_equals(origin_detective,true), flag_equals(detective_prologue_done,true))
    require_all:
      - var_gte(attr_intellect,2)
    effects:
      - add_var(checks_passed,1)
      - track_event(detective_runtime_case_open)
  - id: DETECTIVE_PRESS_VICTORIA
    text: Press Victoria for the missing witness names
    next: scene_detective_runtime_case01_arrival
    visible_if_any:
      - or(flag_equals(origin_detective,true), flag_equals(origin_journalist,true))
    effects:
      - add_tension(1)
```
