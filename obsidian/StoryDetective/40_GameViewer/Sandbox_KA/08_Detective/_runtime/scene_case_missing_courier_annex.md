---
id: scene_case_missing_courier_annex
type: vn_scene
status: active
---

# Scene: Clerk Annex Audit

## Script

In a side annex lit by one weak oil lamp, duplicate registry books reveal rerouted
docket numbers. Someone inside the municipal chain copied internal movement codes.
If true, the courier was intercepted with help from an office leak.
Your internal argument is simple and cruel: file fast and stop the next hit, or file
clean and risk arriving late.

```vn-logic
passive_checks:
  - id: check_annex_duplicate_pattern
    voice_id: attr_intellect
    difficulty: 13
    show_chance_percent: true
    karma_sensitive: true
    outcome_model: binary
    on_success:
      effects:
        - set_flag(cityhall_leak_chain_documented,true)
        - add_var(case_missing_courier_evidence,1)
    on_fail:
      effects:
        - set_flag(cityhall_leak_chain_incomplete,true)
choices:
  - id: CASE_MISSING_COURIER_ANNEX_BUILD_CASE
    text: Build a full leak chain before naming suspects in the report.
    next: scene_case_missing_courier_debrief_success
    require_all:
      - var_gte(attr_intellect,2)
    effects:
      - set_flag(cityhall_leak_confirmed,true)
      - set_flag(courier_found_alive,true)
      - add_var(case_missing_courier_evidence,1)
  - id: CASE_MISSING_COURIER_ANNEX_FILE_FAST
    text: File an urgent partial report to prevent document disappearance.
    next: scene_case_missing_courier_debrief_partial
    effects:
      - set_flag(cityhall_archive_target_known,true)
  - id: CASE_MISSING_COURIER_ANNEX_BLAME_GUARD
    text: Close quickly by blaming the watchman without corroboration.
    next: scene_case_missing_courier_debrief_compromised
    effects:
      - set_flag(case_missing_courier_false_detention,true)
      - add_tension(1)
  - id: CASE_MISSING_COURIER_ANNEX_TARGET_ARCHIVE
    text: Prioritize proving the archive target and defer immediate arrests.
    next: scene_case_missing_courier_debrief_partial
    visible_if_all:
      - flag_equals(cityhall_leak_chain_documented,true)
    effects:
      - set_flag(cityhall_archive_target_known,true)
      - set_flag(case_missing_courier_no_false_arrest,true)
```
