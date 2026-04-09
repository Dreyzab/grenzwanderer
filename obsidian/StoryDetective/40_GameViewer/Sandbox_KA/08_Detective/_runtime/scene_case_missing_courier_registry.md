---
id: scene_case_missing_courier_registry
type: vn_scene
status: active
---

# Scene: Registry Desk

## Script

At the municipal registry, the dispatch ledger shows the courier's initials and a
stop code scratched over in fresh graphite. The senior clerk swears the route was
unchanged; the janitor insists he saw the courier arguing with a second man.

```vn-logic
on_enter:
  - set_flag(courier_clue_registry,true)
passive_checks:
  - id: check_registry_ink_age
    voice_id: attr_perception
    difficulty: 11
    show_chance_percent: true
    karma_sensitive: true
    outcome_model: binary
    on_success:
      effects:
        - set_flag(courier_registry_overwrite_fresh,true)
        - add_var(case_missing_courier_evidence,1)
    on_fail:
      effects:
        - add_tension(1)
choices:
  - id: CASE_MISSING_COURIER_REGISTRY_LOG
    text: Seize a certified copy of the ledger page and log the overwrite.
    next: scene_case_missing_courier_apothecary
    effects:
      - set_flag(courier_route_confirmed,true)
      - add_var(case_missing_courier_evidence,1)
  - id: CASE_MISSING_COURIER_REGISTRY_PRESS
    text: Pressure the clerk without proper authority to force a statement.
    next: scene_case_missing_courier_apothecary
    effects:
      - set_flag(case_missing_courier_procedural_risk,true)
      - add_tension(1)
  - id: CASE_MISSING_COURIER_REGISTRY_LEDGER_THEORY
    text: Compare ink age against dispatch timing and flag a staged edit.
    next: scene_case_missing_courier_apothecary
    visible_if_all:
      - flag_equals(courier_registry_overwrite_fresh,true)
    require_all:
      - var_gte(attr_intellect,2)
    effects:
      - set_flag(courier_registry_tamper_theory,true)
      - add_var(case_missing_courier_evidence,1)
```
