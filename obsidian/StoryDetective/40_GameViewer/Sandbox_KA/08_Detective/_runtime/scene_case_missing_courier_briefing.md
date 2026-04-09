---
id: scene_case_missing_courier_briefing
type: vn_scene
status: active
---

# Scene: Bureau Briefing

## Script

The morning roster is still wet with ink when the chief drops a courier docket on
your desk. The messenger vanished between municipal stops, carrying planning papers
that now matter more than the council admits.
The room wants speed; your notebook wants sequence.

```vn-logic
on_enter:
  - set_flag(case_missing_courier_started,true)
  - set_flag(courier_route_confirmed,false)
  - set_flag(courier_found_alive,false)
  - set_flag(cityhall_leak_confirmed,false)
passive_checks:
  - id: check_briefing_risk_language
    voice_id: attr_intellect
    difficulty: 10
    show_chance_percent: true
    karma_sensitive: true
    outcome_model: binary
    on_success:
      effects:
        - set_flag(case_missing_courier_clock_is_political,true)
    on_fail:
      effects:
        - add_tension(1)
choices:
  - id: CASE_MISSING_COURIER_TO_REGISTRY
    text: Start with the registry ledger and trace the official handoff.
    next: scene_case_missing_courier_registry
    effects:
      - track_event(case_missing_courier_briefing)
  - id: CASE_MISSING_COURIER_BRIEFING_PROTOCOL
    text: Request written scope to protect evidence handling from interference.
    next: scene_case_missing_courier_registry
    require_all:
      - var_gte(attr_intellect,2)
    effects:
      - set_flag(case_missing_courier_protocol_cover,true)
      - add_var(case_missing_courier_evidence,1)
```
