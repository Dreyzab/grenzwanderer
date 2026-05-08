---
id: scene_case01_workers_exit
type: vn_scene
status: active
---

# Noise Without Hands

## Script

The tavern does not become friendly. It becomes useful. The clay is real, the
thermite association is real, and the street action was real. The center is
missing. Someone scheduled the workers like a shield and let Freiburg mistake a
crowd for a conspiracy.

```vn-logic
terminal: true
on_enter:
  - set_flag(false_trail_workers_complete,true)
  - grant_xp(15)
choices: []
```
