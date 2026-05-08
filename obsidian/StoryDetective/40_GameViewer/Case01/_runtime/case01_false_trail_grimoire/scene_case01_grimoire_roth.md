---
id: scene_case01_grimoire_roth
type: vn_scene
status: active
character_id: npc_emil_roth
---

# Emil Roth

## Script

Roth finally stops defending his soul and starts defending his trade. He did
not steal Razlom. He priced it, admired it, feared it, and spoke too freely in
a private salon. "Collectors ask about provenance. Priests ask about curses.
This man asked how much the book weighed."

```vn-logic
choices:
  - id: CASE01_GRIMOIRE_MORAL
    text: Tell Roth he did not steal the book, but he told a thief how to steal it.
    next: scene_case01_grimoire_exit
    skill_check:
      id: check_case01_grimoire_moral
      voice_id: attr_empathy
      difficulty: 11
      show_chance_percent: true
      on_success:
        next: scene_case01_grimoire_exit
        effects:
          - discover_fact(case_bankhaus_krebs_false_trail,fact_roth_leaked_razlom)
          - grant_evidence(ev_technical_grimoire_questions)
          - grant_xp(10)
      on_fail:
        next: scene_case01_grimoire_exit
        effects:
          - add_tension(1)
    effects:
      - set_flag(false_trail_grimoire_refuted,true)
  - id: CASE01_GRIMOIRE_LEDGER
    text: Follow the salon note chain instead of the occult panic.
    next: scene_case01_grimoire_exit
    effects:
      - discover_fact(case_bankhaus_krebs_false_trail,fact_roth_leaked_razlom)
      - discover_fact(case_bankhaus_krebs_false_trail,fact_grimoire_questions_were_technical)
      - grant_evidence(ev_technical_grimoire_questions)
      - set_flag(false_trail_grimoire_refuted,true)
      - grant_xp(10)
```
