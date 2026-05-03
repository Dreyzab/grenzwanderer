---
id: scene_case01_mayor_entry
type: vn_scene
status: active
---

# Scene: Mayor's Office

## Script

The mayor leaves you standing long enough to make the room feel like a test.
He wants the panic contained, the council reassured, and the bank matter closed
before the newspapers decide City Hall was in on it. The message is polite only
because there are clerks listening outside the door.

```vn-logic
choices:
  - id: CASE01_MAYOR_INDEPENDENT_FOOTING
    text: Let the Rathaus note that you arrived without Hartmann sponsorship.
    next: scene_case01_mayor_independent_footing
    visible_if_all:
      - flag_equals(flag_declined_eleonora_hospitality,true)
  - id: CASE01_MAYOR_PRESS
    text: Ask what the Rathaus is most afraid of.
    next: scene_case01_mayor_dossier
    effects:
      - grant_xp(5)
  - id: CASE01_MAYOR_CLARA
    text: Ask why Clara von Altenburg is already moving around the bank.
    next: scene_case01_mayor_dossier
```
