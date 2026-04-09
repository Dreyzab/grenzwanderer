---
id: scene_case_missing_courier_storehouse
type: vn_scene
status: active
---

# Scene: Canal Storehouse

## Script

By the canal loading doors you find a torn satchel strap and wax flakes stamped with
a municipal seal. The watchman claims he saw no one. Two dockhands whisper he was
paid to look away before midnight.
Your gut says the scene is dirty, but your training says dirty scenes still talk if
you log them in order.

```vn-logic
passive_checks:
  - id: check_storehouse_scene_order
    voice_id: attr_perception
    difficulty: 11
    show_chance_percent: true
    karma_sensitive: true
    outcome_model: binary
    on_success:
      effects:
        - set_flag(courier_chain_preserved,true)
    on_fail:
      effects:
        - set_flag(courier_scene_noise_high,true)
choices:
  - id: CASE_MISSING_COURIER_STOREHOUSE_EVIDENCE
    text: Bag and log physical traces before questioning anyone further.
    next: scene_case_missing_courier_annex
    effects:
      - set_flag(courier_intercept_site_confirmed,true)
      - add_var(case_missing_courier_evidence,1)
  - id: CASE_MISSING_COURIER_STOREHOUSE_RUSH
    text: Chase suspects immediately and leave scene logging for later.
    next: scene_case_missing_courier_annex
    effects:
      - set_flag(case_missing_courier_chain_of_custody_risk,true)
      - add_tension(1)
  - id: CASE_MISSING_COURIER_STOREHOUSE_RECONSTRUCT
    text: Reconstruct the handoff minute by minute from dock labor shifts.
    next: scene_case_missing_courier_annex
    visible_if_all:
      - flag_equals(courier_chain_preserved,true)
    require_all:
      - var_gte(attr_intellect,2)
    effects:
      - set_flag(courier_handoff_timeline_verified,true)
      - add_var(case_missing_courier_evidence,1)
```
