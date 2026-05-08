---
id: scene_case01_mayor_exit
type: vn_scene
status: active
---

# Scene: Official Writ

## Script

By the time you leave, you have enough paper to open doors, enough political
pressure to know those same doors may close behind you, and enough ambiguity
for the Rathaus to deny it ever appointed Victoria Sterling at all.

That is the bargain: she enters the bank as your private scientific consultant,
not as an officer. The Oberbuergermeister watches his daughter fold her gloves
around the sample tube and looks, for one unguarded second, more father than
state.

```vn-logic
terminal: true
on_enter:
  - set_flag(mayor_briefing_complete,true)
  - unlock_group(loc_freiburg_bank)
  - type: track_event
    eventName: case01_mayor_briefing_complete
choices: []
```
