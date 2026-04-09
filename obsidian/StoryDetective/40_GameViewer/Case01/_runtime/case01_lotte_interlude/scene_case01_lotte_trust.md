---
id: scene_case01_lotte_trust
type: vn_scene
status: active
character_id: npc_weber_dispatcher
---

# Scene: Channel Preserved

## Script

Lotte does not soften, but she does stay on the line. The warning becomes a
working channel instead of a courtesy. She is trusting you with more than a
message now.

```vn-logic
terminal: true
on_enter:
  - set_flag(lotte_interlude_complete,true)
  - set_flag(lotte_warning_heeded,true)
  - change_relationship(npc_weber_dispatcher,1)
choices: []
```
