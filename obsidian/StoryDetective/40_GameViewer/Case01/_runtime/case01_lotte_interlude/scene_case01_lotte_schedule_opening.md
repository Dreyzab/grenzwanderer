---
id: scene_case01_lotte_schedule_opening
type: vn_scene
status: active
character_id: npc_weber_dispatcher
---

# Scene: Time on the Wire

## Script

**[Detective]**:
-- In the train, you were not taking notes. You were keeping time.

**[Lotte]**:
-- Time keeps itself. I only mark when people pretend they arrived by chance.

The line hisses around her answer. She does not deny the schedule; she only
waits to see whether you understand what a schedule can accuse.

```vn-logic
choices:
  - id: CASE01_LOTTE_SCHEDULE_TRUST
    text: Use the timing and ask for one more quiet relay.
    next: scene_case01_lotte_trust
  - id: CASE01_LOTTE_SCHEDULE_DISTANCE
    text: Keep the timing off the record and set a boundary.
    next: scene_case01_lotte_distance
```
