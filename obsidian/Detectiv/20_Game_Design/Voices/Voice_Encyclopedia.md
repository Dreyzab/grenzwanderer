---
id: voice_encyclopedia
tags:
  - mechanic
  - voice
voice_id: encyclopedia
department: Brain
readiness: production
persona_archetype: "Encyclopedia specialist"
persona_manners: "Speaks in a encyclopedia-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to encyclopedia checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through encyclopedia."
persona_blind_spot: "Can overfit decisions to encyclopedia and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to encyclopedia heuristics."
gameplay_primary_loops:
  - investigation
  - social
  - meta
gameplay_check_roles:
  - context_unpack
  - institution_lookup
  - historical_parallel
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_alt_briefing_entry
  - node_case1_bank_investigation
  - node_case1_rathaus_hearing
case01_character_hooks:
  - char_mayor
  - char_archive_keeper
  - char_journalist
aliases:
  - Enzyklopaedie
---

# Voice: Encyclopedia

> "A century of precedent is a weapon if you can index it."

## Description

Encyclopedia is one of the Brain voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Encyclopedia specialist.
- **Manners**: Speaks in a encyclopedia-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to encyclopedia checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through encyclopedia.
- **Blind Spot**: Can overfit decisions to encyclopedia and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to encyclopedia heuristics.

## Tone of Voice

- **Speech Pattern**: Lecturing and referential.
- **Vocabulary**: Historical and institutional.
- **Emotional Range**: eager recall to pedantic flood.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                             |
| --------------------- | ----------------------------------------------------------------------------------- |
| **Fail** (< DC)       | "Encyclopedia: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Encyclopedia: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Encyclopedia: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                              |
| ------------ | -------------------------------------------------------------------- |
| **Fail**     | "Encyclopedia: Their story holds for now. We need another angle."    |
| **Pass**     | "Encyclopedia: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Encyclopedia: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `investigation`, `social`, `meta`.
- **Check roles**: `context_unpack`, `institution_lookup`, `historical_parallel`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_alt_briefing_entry|node_case1_alt_briefing_entry]]
- [[10_Narrative/Scenes/node_case1_bank_investigation|node_case1_bank_investigation]]
- [[10_Narrative/Scenes/node_case1_rathaus_hearing|node_case1_rathaus_hearing]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_mayor|char_mayor]]
- [[30_World_Intel/Characters/char_archive_keeper|char_archive_keeper]]
- [[30_World_Intel/Characters/char_journalist|char_journalist]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Tradition|Voice_Tradition]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Gambling|Voice_Gambling]].

## Passive Check Catalog

| Scene / Location     | DC  | On Success                                                        | On Fail                                                    |
| -------------------- | --- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| loc_freiburg_archive | 9   | Recalls bank charter loophole from 1889                           | Provides irrelevant context and loses tempo                |
| loc_freiburg_archive | 9   | Recalls a historical precedent that strengthens the pressure line | Picks a wrong source but opens an alternative archive fund |
