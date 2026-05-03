---
id: scene_case01_zum_goldenen_adler_lotte_route
type: vn_scene
status: active
background_url: /images/scenes/case01/bg_case01_zum_goldenen_adler_blotter_timetable.webp
---

# Scene: Route Already Marked

## Script

The clerk lowers his eyes to the register. "Fraulein Weber asked whether the
room would be aired before the noon rush. She did not ask twice."

On the blotter lies a timetable corner, folded once. 08:41 is underlined; not
in ink, but by pressure.

Freiburg has not followed you. Not yet. It has simply prepared a chair where
your question said you might sit.

```vn-logic
choices:
  - id: CASE01_zum_goldenen_adler_ROUTE_SETTLE
    text: Leave the timetable where it is and take the key.
    next: scene_case01_zum_goldenen_adler_settle
```
