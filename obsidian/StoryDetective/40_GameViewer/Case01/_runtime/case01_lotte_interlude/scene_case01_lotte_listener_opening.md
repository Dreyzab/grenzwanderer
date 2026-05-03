---
id: scene_case01_lotte_listener_opening
type: vn_scene
status: active
character_id: npc_weber_dispatcher
---

# Scene: Listener on the Wire

## Script

You do not fill the hiss with a question. For three seconds the line carries
only the room around her: switchboard clicks, paper shifting, one careful
breath.

"Still listening," Lotte says. "Good. Most men only pause long enough to reload
their own certainty."

The warning has not changed, but its first edge is yours now.

```vn-logic
choices:
  - id: CASE01_LOTTE_LISTENER_TRUST
    text: Keep the line open and ask for one more quiet relay.
    next: scene_case01_lotte_trust
  - id: CASE01_LOTTE_LISTENER_DISTANCE
    text: Keep the silence professional and tell her to stay off the record.
    next: scene_case01_lotte_distance
```
