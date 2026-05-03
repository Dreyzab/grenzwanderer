---
id: scene_case01_lotte_warning
type: vn_scene
status: active
character_id: npc_weber_dispatcher
---

# Scene: Lotte on the Wire

## Script

The telephone line hisses before Lotte Weber speaks. She has seen switchboard
traffic redirect itself around your questions, which means somebody knows the
investigation is narrowing. Her warning is plain: if you keep pulling the
thread in daylight, the city will pull back in uniform.

```vn-logic
choices:
  - id: CASE01_LOTTE_CONFRONT_SCHEDULE
    text: Ask why her train notes kept time instead of names.
    next: scene_case01_lotte_schedule_opening
    visible_if_all:
      - flag_equals(noticed_lotte_schedule,true)
  - id: CASE01_LOTTE_LISTENER_OPENING
    text: Let the silence do some of the work before you answer.
    next: scene_case01_lotte_listener_opening
    visible_if_all:
      - flag_equals(flag_silent_observation,true)
      - not(flag_equals(noticed_lotte_schedule,true))
  - id: CASE01_LOTTE_TRUST
    text: Thank her and ask for one more quiet relay.
    next: scene_case01_lotte_trust
  - id: CASE01_LOTTE_DISTANCE
    text: Keep it professional and tell her to stay off the record.
    next: scene_case01_lotte_distance
```
