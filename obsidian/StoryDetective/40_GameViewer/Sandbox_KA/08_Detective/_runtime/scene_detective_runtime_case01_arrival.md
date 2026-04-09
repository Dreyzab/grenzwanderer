---
id: scene_detective_runtime_case01_arrival
type: vn_scene
status: active
---

# Scene: Bank Arrival

## Script

The iron gate is still warm from the first police shift. Inside, the service
corridor smells of polish, steam, and a fear that has already learned to hide.

```vn-logic
preconditions:
  - not(flag_equals(banker_case_closed,true))
choices:
  - id: DETECTIVE_ENTER_BANK
    text: Step through the service entrance
    next: scene_detective_runtime_case01_investigation
    effects:
      - track_event(detective_runtime_arrival)
```
