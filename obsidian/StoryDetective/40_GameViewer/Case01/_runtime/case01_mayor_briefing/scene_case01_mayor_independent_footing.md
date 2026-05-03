---
id: scene_case01_mayor_independent_footing
type: vn_scene
status: active
---

# Scene: Independent Footing

## Script

The mayor's secretary notices the absence before the mayor admits it. No
Hartmann carriage waits outside, no borrowed calling card lies on the tray, no
soft introduction has crossed the desk ahead of you.

"Good," the mayor says at last. "Then for the next few minutes this can remain
a municipal conversation."

It is not warmth. It is a cleaner ledger.

```vn-logic
choices:
  - id: CASE01_MAYOR_INDEPENDENT_TO_DOSSIER
    text: Take the cleaner footing and ask what the Rathaus is most afraid of.
    next: scene_case01_mayor_dossier
```
