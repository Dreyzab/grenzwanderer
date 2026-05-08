---
id: scene_case01_workers_entry
type: vn_scene
status: active
character_id: npc_anna_mahler
---

# Red Cog Tavern

## Script

Anna Mahler lets the tavern look at you before she does. A bootprint sketch,
grey river clay, and the word "thermite" travel around the room faster than
your badge. "You call it evidence," she says. "I call it a boot belonging to a
man who must report for shift in the morning." The workers could have made the
noise. They could have touched the clay. They could even have known the heat of
rail metal. That is why the trail is so neat.

```vn-logic
choices:
  - id: CASE01_WORKERS_SOCIAL
    text: Say you are not here for a culprit, but for whoever used their noise.
    next: scene_case01_workers_rudi
    skill_check:
      id: check_case01_workers_social
      voice_id: attr_social
      difficulty: 10
      show_chance_percent: true
      on_success:
        next: scene_case01_workers_rudi
        effects:
          - change_favor_balance(npc_anna_mahler,1,false_trail_workers_respect)
          - grant_xp(10)
      on_fail:
        next: scene_case01_workers_rudi
        effects:
          - add_tension(1)
    effects:
      - grant_evidence(ev_grey_river_clay)
      - discover_fact(case_bankhaus_krebs_false_trail,fact_workers_clay_and_noise)
  - id: CASE01_WORKERS_PRESSURE
    text: Put thermite, clay, and rail work on the table hard enough to quiet the room.
    next: scene_case01_workers_rudi
    skill_check:
      id: check_case01_workers_pressure
      voice_id: attr_authority
      difficulty: 12
      show_chance_percent: true
      on_success:
        next: scene_case01_workers_rudi
        effects:
          - set_flag(false_trail_workers_pressure_used,true)
          - grant_xp(10)
      on_fail:
        next: scene_case01_workers_rudi
        effects:
          - add_heat(1)
          - change_favor_balance(npc_anna_mahler,-1,false_trail_workers_pressure)
    effects:
      - grant_evidence(ev_grey_river_clay)
      - discover_fact(case_bankhaus_krebs_false_trail,fact_workers_clay_and_noise)
  - id: CASE01_WORKERS_TECHNICAL
    text: Explain that rail thermite leaves rough habits; the bank cut was clean.
    next: scene_case01_workers_rudi
    skill_check:
      id: check_case01_workers_technical
      voice_id: attr_encyclopedia
      difficulty: 11
      show_chance_percent: true
      on_success:
        next: scene_case01_workers_rudi
        effects:
          - grant_evidence(ev_thermite_slag_ratio)
          - discover_fact(case_bankhaus_krebs_false_trail,fact_thermite_too_clean_for_workers)
          - grant_xp(10)
      on_fail:
        next: scene_case01_workers_rudi
        effects:
          - add_tension(1)
    effects:
      - grant_evidence(ev_grey_river_clay)
      - discover_fact(case_bankhaus_krebs_false_trail,fact_workers_clay_and_noise)
```
