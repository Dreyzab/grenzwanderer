---
id: scene_case01_mayor_dossier
type: vn_scene
status: active
---

# Scene: Political Pressure

## Script

He gives you three things and pretends they are one: a permit to press deeper
into the records later, a warning that Galdermann has friends who pay for
silence, and a refusal to say Hartmann's name until you give him something the
council can survive hearing in public.

```vn-logic
choices:
  - id: CASE01_MAYOR_FELIX_ASIDE
    text: Let Felix read the official cover before you accept it.
    next: scene_case01_mayor_felix_aside
    visible_if_all:
      - flag_equals(flag_defended_felix,true)
  - id: CASE01_MAYOR_TO_BANK
    text: Take the briefing and move to the bank with official cover.
    next: scene_case01_mayor_exit
    effects:
      - set_flag(met_mayor_first,true)
      - change_relationship(assistant,1)
```
