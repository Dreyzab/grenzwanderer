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
because there are clerks listening outside the door and a Polizeidirektor
standing beside the stove like procedure has borrowed a spine.

On the corner of the desk, half hidden under council minutes, a grey folder
carries the same control code as the corner of Weber's telegram. The
Oberbuergermeister has not merely asked for help. He has activated a protocol
he is afraid to name.

"I asked the police to attach a scientific observer," he says, and hates how
small the sentence sounds. "They refused my daughter on grounds of decorum."

The door opens before the Polizeidirektor can enjoy the word. Victoria Sterling
enters with a sealed sample tube, a strip of black-yellow postal twine, and the
look of a woman who has already heard every objection twice. She places the
twine beside the folder.

"The route was bent before the gas reached the bank," she says. "If you want a
robbery, gentlemen, you will have to explain why it travelled like a delivery."

```vn-logic
choices:
  - id: CASE01_MAYOR_INDEPENDENT_FOOTING
    text: Let the Rathaus note that you arrived without Hartmann sponsorship.
    next: scene_case01_mayor_independent_footing
    visible_if_all:
      - flag_equals(flag_declined_eleonora_hospitality,true)
  - id: CASE01_MAYOR_PRESS
    text: Ask why the Polizeidirektor refused Victoria's findings.
    next: scene_case01_mayor_dossier
    effects:
      - set_flag(police_refused_victoria,true)
      - set_flag(victoria_introduced,true)
      - grant_evidence(ev_bureau_control_code)
      - discover_fact(case_bankhaus_krebs_false_trail,fact_mayor_control_code)
      - grant_xp(5)
  - id: CASE01_MAYOR_VICTORIA_ROUTE
    text: Let Victoria finish the postal-chain argument before anyone interrupts.
    next: scene_case01_mayor_dossier
    effects:
      - set_flag(police_refused_victoria,true)
      - set_flag(victoria_introduced,true)
      - set_var(official_writ_strength,1)
```
