---
id: scene_detective_runtime_case01_investigation
type: vn_scene
status: active
---

# Scene: First Sweep

## Script

The first pass through the room is never about brilliance. It is about rhythm:
door, ledger, window latch, clerk's shoes, the ash tray nobody admits to using.

```vn-logic
on_enter:
  - set_flag(banker_intro_seen,true)
  - add_var(checks_passed,1)
passive_checks:
  - id: check_detective_floor
    voice_id: attr_perception
    difficulty: 10
    show_chance_percent: true
    karma_sensitive: true
    outcome_model: binary
    on_success:
      effects:
        - set_flag(banker_nervous_noticed,true)
    on_fail:
      effects:
        - add_tension(1)
choices:
  - id: DETECTIVE_CHECK_MESSAGES
    text: Finish the sweep and return to the bureau for new dockets.
    next: scene_case_missing_courier_briefing
```
