---
id: scene_case01_mayor_dossier
type: vn_scene
status: active
character_id: victoria_sterling
---

# Scene: Political Pressure

## Script

The Polizeidirektor calls Victoria "Frau Sterling" as if widowhood is a more
acceptable credential than chemistry. Her jaw tightens only once. The mayor
does not look at her when he answers; that is how you learn the request is
personal before it is political.

He gives you three things and pretends they are one: a permit to press deeper
into the records later, a warning that Galdermann has friends who pay for
silence, and an unofficial attachment of Victoria as private scientific
consultant under your responsibility. It is not a badge. It is enough paper to
make the next door hesitate.

```vn-logic
choices:
  - id: CASE01_MAYOR_FELIX_ASIDE
    text: Let Felix read the official cover before you accept it.
    next: scene_case01_mayor_felix_aside
    visible_if_all:
      - flag_equals(flag_defended_felix,true)
  - id: CASE01_MAYOR_RESPECT_VICTORIA
    text: Recognize Victoria's chain of custody as the strongest evidence in the room.
    next: scene_case01_mayor_exit
    effects:
      - set_flag(met_mayor_first,true)
      - set_flag(police_refused_victoria,true)
      - set_flag(victoria_introduced,true)
      - set_flag(victoria_respected,true)
      - set_var(official_writ_strength,2)
      - change_relationship(victoria_sterling,1)
  - id: CASE01_MAYOR_PATRONIZE_VICTORIA
    text: Accept the Oberbuergermeister's daughter as a liability you will manage.
    next: scene_case01_mayor_exit
    effects:
      - set_flag(met_mayor_first,true)
      - set_flag(police_refused_victoria,true)
      - set_flag(victoria_introduced,true)
      - set_var(official_writ_strength,1)
      - change_relationship(victoria_sterling,-1)
  - id: CASE01_MAYOR_PRESS_WITH_VICTORIA
    text: Use Victoria's postal route to force the Rathaus into a stronger writ.
    next: scene_case01_mayor_exit
    effects:
      - set_flag(met_mayor_first,true)
      - set_flag(police_refused_victoria,true)
      - set_flag(victoria_introduced,true)
      - set_var(official_writ_strength,2)
      - add_tension(1)
  - id: CASE01_MAYOR_TO_BANK
    text: Accept Victoria as a neutral expert and move to the bank.
    next: scene_case01_mayor_exit
    effects:
      - set_flag(met_mayor_first,true)
      - set_flag(police_refused_victoria,true)
      - set_flag(victoria_introduced,true)
      - set_var(official_writ_strength,1)
```
