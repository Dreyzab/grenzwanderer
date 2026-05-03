---
id: scene_case01_zum_goldenen_adler_entry
type: vn_scene
status: active
---

# Scene: Zum Goldenen Adler

## Script

The inn keeps its warmth behind polished wood and practiced discretion. Your
room is reserved, your name is legible in the register, and the clerk has
already decided which parts of your arrival are ordinary enough to say aloud.

```vn-logic
choices:
  - id: CASE01_zum_goldenen_adler_LOTTE_ROUTE
    text: Ask why the route was ready before you arrived.
    next: scene_case01_zum_goldenen_adler_lotte_route
    visible_if_all:
      - flag_equals(flag_asked_lodging_route,true)
  - id: CASE01_zum_goldenen_adler_SETTLE
    text: Take the room and keep the inn out of the file for now.
    next: scene_case01_zum_goldenen_adler_settle
```
