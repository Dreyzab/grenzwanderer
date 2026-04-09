---
id: scene_case01_tailor_exit
type: vn_scene
status: active
---

# Scene: Identity Bundle Locked

## Script

The tailor does not want his name in the file. You do not need it there yet.
What matters is the route: disguise, cash runner, Hartmann.

```vn-logic
terminal: true
on_enter:
  - set_flag(tailor_lead_complete,true)
  - grant_xp(10)
choices: []
```
