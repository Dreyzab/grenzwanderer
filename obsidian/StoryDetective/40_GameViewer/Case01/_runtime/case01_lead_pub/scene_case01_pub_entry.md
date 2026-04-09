---
id: scene_case01_pub_entry
type: vn_scene
status: active
---

# Scene: Zum Schlappen

## Script

The tavern keeper watches the room before answering. Once Gustav Brandt realizes
you can offer protection instead of theatre, he confirms Hartmann's name, a
warehouse window, and a disguised runner moving under worker cover after
curfew.

```vn-logic
choices:
  - id: CASE01_PUB_COMPLETE
    text: Take Gustav's timing window and close the logistics bundle.
    next: scene_case01_pub_exit
```
