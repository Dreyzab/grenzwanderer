---
id: scene_case_missing_courier_apothecary
type: vn_scene
status: active
---

# Scene: Apothecary Lane

## Script

The apothecary keeps receipts in a biscuit tin under the counter. One is marked to
the courier's household for a costly fever draught. A neighbor claims he disappeared
to gamble; the pharmacist says he begged for delayed payment for his child's medicine.
In your notes, one line keeps returning: debt is motive pressure, not confession.

```vn-logic
passive_checks:
  - id: check_apothecary_stress_pattern
    voice_id: attr_perception
    difficulty: 12
    show_chance_percent: true
    karma_sensitive: true
    outcome_model: binary
    on_success:
      effects:
        - set_flag(courier_desperation_not_guilt,true)
    on_fail:
      effects:
        - set_flag(courier_motive_ambiguous,true)
choices:
  - id: CASE_MISSING_COURIER_APOTHECARY_RECEIPT
    text: Record the medicine debt as motive pressure, not proof of guilt.
    next: scene_case_missing_courier_station
    effects:
      - set_flag(courier_child_medical_debt_known,true)
      - add_var(case_missing_courier_evidence,1)
      - change_relationship(apothecary,1)
  - id: CASE_MISSING_COURIER_APOTHECARY_INTIMIDATE
    text: Threaten seizure for non-cooperation and take the ledger by force.
    next: scene_case_missing_courier_station
    effects:
      - set_flag(case_missing_courier_network_damage,true)
      - add_tension(1)
  - id: CASE_MISSING_COURIER_APOTHECARY_FAMILY_LINE
    text: Ask for treatment dates to cross-check whether the courier could be on route.
    next: scene_case_missing_courier_station
    visible_if_any:
      - flag_equals(courier_desperation_not_guilt,true)
    require_all:
      - var_gte(attr_intellect,2)
    effects:
      - set_flag(courier_alibi_window_narrowed,true)
      - add_var(case_missing_courier_evidence,1)
```
