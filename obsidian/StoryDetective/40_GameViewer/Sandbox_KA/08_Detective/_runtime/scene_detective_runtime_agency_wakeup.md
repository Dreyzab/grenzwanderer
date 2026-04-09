---
id: scene_detective_runtime_agency_wakeup
type: vn_scene
status: active
---

# Scene: Detective Agency Wakeup

## Script

Cold window light cuts across the desk before the coffee does. The Freiburg file
is already open, weighted down by a brass ruler and the night's unanswered
telegrams.

```vn-logic
preconditions:
  - and(flag_equals(origin_detective,true), not(flag_equals(origin_detective_handoff_done,true)))
on_enter:
  - set_flag(origin_detective_handoff_done,true)
choices:
  - id: DETECTIVE_REPORT_IN
    text: Report to the agency floor
    next: scene_detective_runtime_agency_orientation
    effects:
      - track_event(detective_runtime_wakeup)
```
