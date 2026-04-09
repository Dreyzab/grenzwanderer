---
id: scene_case01_lotte_distance
type: vn_scene
status: active
character_id: npc_weber_dispatcher
---

# Scene: Channel Narrowed

## Script

She accepts the distance faster than you wanted her to. The warning stands, but
the next call will cost more trust than this one did.

```vn-logic
terminal: true
on_enter:
  - set_flag(lotte_interlude_complete,true)
  - set_flag(lotte_warning_heeded,false)
  - change_relationship(npc_weber_dispatcher,-1)
choices: []
```
