---
id: scene_case01_pub_exit
type: vn_scene
status: active
---

# Scene: Logistics Bundle Locked

## Script

You leave the pub with the first route to the warehouse that sounds like a
schedule instead of a rumor. Somebody is moving people, ledgers, and disguises
on the same night rhythm.

```vn-logic
terminal: true
on_enter:
  - set_flag(pub_lead_complete,true)
  - grant_xp(10)
choices: []
```
