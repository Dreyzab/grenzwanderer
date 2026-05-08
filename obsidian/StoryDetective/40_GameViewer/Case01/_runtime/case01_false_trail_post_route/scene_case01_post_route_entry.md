---
id: scene_case01_post_route_entry
type: vn_scene
status: active
character_id: npc_emil_rapp
---

# Route Ledger

## Script

Stationmaster Emil Rapp does not like civilian investigators inside timetable
logic. The wrong post lantern changes that. A Sunday carriage was marked like a
lawful route, logged like a municipal favor, and moved like an order nobody
wanted to countersign. Kaspar Blume watches from the crates with the expression
of a man waiting for the official lie to become expensive.

```vn-logic
choices:
  - id: CASE01_POST_DOCUMENTS
    text: Cross-check the route journal, lantern color, and departure time.
    next: scene_case01_post_route_weber
    skill_check:
      id: check_case01_post_documents
      voice_id: attr_logic
      difficulty: 11
      show_chance_percent: true
      on_success:
        next: scene_case01_post_route_weber
        effects:
          - grant_evidence(ev_wrong_post_lantern)
          - discover_fact(case_bankhaus_krebs_false_trail,fact_post_route_was_bent)
          - grant_xp(10)
      on_fail:
        next: scene_case01_post_route_weber
        effects:
          - add_tension(1)
    effects:
      - set_flag(false_trail_post_route_complete,true)
  - id: CASE01_POST_KASPAR
    text: Let Kaspar price the detail the stationmaster will not say aloud.
    next: scene_case01_post_route_weber
    skill_check:
      id: check_case01_post_kaspar
      voice_id: attr_shadow
      difficulty: 10
      show_chance_percent: true
      on_success:
        next: scene_case01_post_route_weber
        effects:
          - grant_evidence(ev_wrong_post_lantern)
          - discover_fact(case_bankhaus_krebs_false_trail,fact_wrong_post_lantern)
          - grant_xp(10)
      on_fail:
        next: scene_case01_post_route_weber
        effects:
          - add_heat(1)
    effects:
      - set_flag(false_trail_post_route_complete,true)
```
