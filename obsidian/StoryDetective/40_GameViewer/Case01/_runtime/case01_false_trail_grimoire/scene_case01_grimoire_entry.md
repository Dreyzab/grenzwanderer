---
id: scene_case01_grimoire_entry
type: vn_scene
status: active
character_id: npc_emil_roth
---

# Book Restorer

## Script

Emil Roth's workshop smells of glue, candle soot, and the panic of a man who
has rehearsed innocence too often. A black scrap lies under a paperweight. It
matches the private box lining too well to be coincidence and too poorly to be
the stolen book itself. Roth knows Razlom as a spine, a weight, and a thing
customers whisper around.

```vn-logic
choices:
  - id: CASE01_GRIMOIRE_OCCULT
    text: Ask about the symbol, the breathing leather, and the fear around the binding.
    next: scene_case01_grimoire_roth
    skill_check:
      id: check_case01_grimoire_occult
      voice_id: attr_spirit
      difficulty: 11
      show_chance_percent: true
      on_success:
        next: scene_case01_grimoire_roth
        effects:
          - grant_evidence(ev_grimoire_binding_trace)
          - discover_fact(case_bankhaus_krebs_false_trail,fact_roth_saw_razlom)
          - shift_awakening(1,1)
      on_fail:
        next: scene_case01_grimoire_roth
        effects:
          - add_tension(1)
    effects:
      - grant_evidence(ev_grimoire_binding_trace)
  - id: CASE01_GRIMOIRE_PRACTICAL
    text: Ask how much it weighed and how fast it could be removed from a box.
    next: scene_case01_grimoire_roth
    skill_check:
      id: check_case01_grimoire_practical
      voice_id: attr_logic
      difficulty: 10
      show_chance_percent: true
      on_success:
        next: scene_case01_grimoire_roth
        effects:
          - grant_evidence(ev_technical_grimoire_questions)
          - discover_fact(case_bankhaus_krebs_false_trail,fact_grimoire_questions_were_technical)
          - grant_xp(10)
      on_fail:
        next: scene_case01_grimoire_roth
        effects:
          - add_tension(1)
    effects:
      - grant_evidence(ev_grimoire_binding_trace)
```
