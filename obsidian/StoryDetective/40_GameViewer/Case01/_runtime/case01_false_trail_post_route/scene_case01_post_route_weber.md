---
id: scene_case01_post_route_weber
type: vn_scene
status: active
character_id: npc_anton_weber
---

# Anton Weber

## Script

Anton Weber keeps wiping his hands on a rag that stopped being clean before
dawn. His carriage, his driver, his route: all true. His crime is smaller and
therefore more frightened. He accepted a stamped order that arrived with enough
military grammar to make refusal feel like treason. "He did not haggle," Weber
says. "He did not even ask the price. He named the hour as if it already
belonged to him."

```vn-logic
choices:
  - id: CASE01_POST_OBSERVE_SEAL
    text: Read the old military seal against the new hand that filled the order.
    next: scene_case01_post_route_exit
    skill_check:
      id: check_case01_post_observe_seal
      voice_id: attr_perception
      difficulty: 11
      show_chance_percent: true
      on_success:
        next: scene_case01_post_route_exit
        effects:
          - grant_evidence(ev_forged_military_dispatch)
          - discover_fact(case_bankhaus_krebs_false_trail,fact_forged_military_dispatch)
          - grant_xp(10)
      on_fail:
        next: scene_case01_post_route_exit
        effects:
          - add_tension(1)
    effects:
      - set_flag(false_trail_post_route_refuted,true)
  - id: CASE01_POST_SCANDAL
    text: Threaten Weber with the public scandal until he gives you the voice.
    next: scene_case01_post_route_exit
    skill_check:
      id: check_case01_post_scandal
      voice_id: attr_authority
      difficulty: 12
      show_chance_percent: true
      on_success:
        next: scene_case01_post_route_exit
        effects:
          - set_flag(false_trail_post_route_pressure_used,true)
          - discover_fact(case_bankhaus_krebs_false_trail,fact_order_giver_had_officer_bearing)
          - grant_xp(10)
      on_fail:
        next: scene_case01_post_route_exit
        effects:
          - add_heat(1)
          - change_faction_signal(civic_order,-1,false_trail_post_scandal)
    effects:
      - set_flag(false_trail_post_route_refuted,true)
```
