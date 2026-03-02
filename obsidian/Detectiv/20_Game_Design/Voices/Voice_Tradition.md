---
id: voice_tradition
tags:
  - mechanic
  - voice
voice_id: tradition
department: Spirit
readiness: production
persona_archetype: "Tradition specialist"
persona_manners: "Speaks in a tradition-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to tradition checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through tradition."
persona_blind_spot: "Can overfit decisions to tradition and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to tradition heuristics."
gameplay_primary_loops:
  - social
  - meta
  - investigation
gameplay_check_roles:
  - ritual_context
  - status_protocol_read
  - custom_constraint_scan
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_rathaus_hearing
  - node_case1_alt_briefing_entry
  - node_case1_archive_warrant_run
case01_character_hooks:
  - char_mayor
  - char_noble
  - char_archive_keeper
aliases:
  - Tradition
---

# Voice: Tradition

> "Institutions remember. Use their memory against them."

## Description

Tradition is one of the Spirit voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Tradition specialist.
- **Manners**: Speaks in a tradition-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to tradition checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through tradition.
- **Blind Spot**: Can overfit decisions to tradition and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to tradition heuristics.

## Tone of Voice

- **Speech Pattern**: Conservative certainty.
- **Vocabulary**: Custom, lineage, precedent.
- **Emotional Range**: steady reverence to moral rigidity.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                          |
| --------------------- | -------------------------------------------------------------------------------- |
| **Fail** (< DC)       | "Tradition: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Tradition: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Tradition: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                           |
| ------------ | ----------------------------------------------------------------- |
| **Fail**     | "Tradition: Their story holds for now. We need another angle."    |
| **Pass**     | "Tradition: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Tradition: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `social`, `meta`, `investigation`.
- **Check roles**: `ritual_context`, `status_protocol_read`, `custom_constraint_scan`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_rathaus_hearing|node_case1_rathaus_hearing]]
- [[10_Narrative/Scenes/node_case1_alt_briefing_entry|node_case1_alt_briefing_entry]]
- [[10_Narrative/Scenes/node_case1_archive_warrant_run|node_case1_archive_warrant_run]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_mayor|char_mayor]]
- [[30_World_Intel/Characters/char_noble|char_noble]]
- [[30_World_Intel/Characters/char_archive_keeper|char_archive_keeper]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Encyclopedia|Voice_Encyclopedia]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Intrusion|Voice_Intrusion]].

## Passive Check Catalog

| Scene / Location | DC  | On Success                                                     | On Fail                                                             |
| ---------------- | --- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| loc_munster      | 7   | Uses protocol to access restricted chapel ledger               | Violates etiquette and loses cooperation                            |
| loc_rathaus      | 11  | Recognizes protocol loophole and unlocks closed hearing access | Misreads regulation but points to a person who knows actual process |
