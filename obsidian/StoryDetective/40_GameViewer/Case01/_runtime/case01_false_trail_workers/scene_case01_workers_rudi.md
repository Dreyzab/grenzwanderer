---
id: scene_case01_workers_rudi
type: vn_scene
status: active
character_id: npc_rudi_kempf
---

# Rudi Kempf

## Script

Rudi Kempf is angry enough to confess to anything except the thing he did not
do. He admits the workers gathered near the bank, admits the signal flare, and
admits the shouted timing that made the square useless to witnesses. Then his
voice breaks into something colder. "We made noise, yes. But if we had burned a
bank, the whole city would have heard our stupidity." When he reaches for a
cigarette, his union card slips forward. On its reverse is a black registry
slash with no union meaning: someone has catalogued him outside the city's
ordinary files.

```vn-logic
choices:
  - id: CASE01_WORKERS_RUDI_NOISE
    text: Separate their protest rhythm from the vault work.
    next: scene_case01_workers_exit
    effects:
      - discover_fact(case_bankhaus_krebs_false_trail,fact_workers_unwitting_cover)
      - grant_evidence(ev_shadow_registry_mark)
      - discover_fact(case_bankhaus_krebs_false_trail,fact_rudi_shadow_registry)
      - set_flag(false_trail_workers_refuted,true)
      - grant_xp(10)
  - id: CASE01_WORKERS_RUDI_CARRIAGE
    text: Ask what moved when everyone watched the shouting.
    next: scene_case01_workers_exit
    effects:
      - grant_evidence(ev_wrong_post_lantern)
      - discover_fact(case_bankhaus_krebs_false_trail,fact_wrong_post_lantern)
      - set_flag(false_trail_workers_refuted,true)
      - grant_xp(10)
```
