---
id: scene_case01_mayor_exit
type: vn_scene
status: active
---

# Scene: Official Writ

## Script

By the time you leave, you have enough paper to open doors and enough political
pressure to know those same doors may close behind you.

```vn-logic
terminal: true
on_enter:
  - set_flag(mayor_briefing_complete,true)
  - unlock_group(loc_freiburg_bank)
  - type: track_event
    eventName: case01_mayor_briefing_complete
choices: []
```
