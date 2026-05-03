---
id: scene_case01_mayor_felix_aside
type: vn_scene
status: active
character_id: assistant
---

# Scene: Felix Reads the Cover

## Script

Felix takes the permit as if it might bruise. He reads the mayor's phrasing
twice, once for law and once for cowardice.

"This gives you doors," he says quietly. "Not protection. If the Rathaus needs
distance later, every sentence here already knows how to step away from you."

He hands it back before anyone can ask whether he was helping you or warning
himself.

```vn-logic
choices:
  - id: CASE01_MAYOR_FELIX_TO_BANK
    text: Take Felix's reading and move to the bank with official cover.
    next: scene_case01_mayor_exit
    effects:
      - set_flag(met_mayor_first,true)
      - change_relationship(assistant,1)
```
