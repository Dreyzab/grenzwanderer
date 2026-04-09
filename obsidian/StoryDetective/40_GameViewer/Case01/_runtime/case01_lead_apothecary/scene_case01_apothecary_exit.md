---
id: scene_case01_apothecary_exit
type: vn_scene
status: active
---

# Scene: Chemical Bundle Locked

## Script

By the time you leave, the residue is no longer mysterious. It is logistical,
expensive, and routed through people who expected the chemistry to look more
important than the theft.

```vn-logic
terminal: true
on_enter:
  - set_flag(apothecary_lead_complete,true)
  - grant_xp(10)
choices: []
```
