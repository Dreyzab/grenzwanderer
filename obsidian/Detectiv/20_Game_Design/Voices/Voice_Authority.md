---
id: voice_authority
tags:
  - mechanic
  - voice
voice_id: authority
department: Character
readiness: production
persona_archetype: "Authority specialist"
persona_manners: "Speaks in a authority-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to authority checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through authority."
persona_blind_spot: "Can overfit decisions to authority and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to authority heuristics."
gameplay_primary_loops:
  - social
  - conflict
gameplay_check_roles:
  - command_pressure
  - status_assertion
  - compliance_break
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_rathaus_hearing
  - node_case1_workers_backchannel
  - node_case1_warehouse_entry_plan
case01_character_hooks:
  - char_gendarm
  - char_mayor
  - char_bank_manager
aliases:
  - Autoritaet
---

# Voice: Authority

> "Order is a language. Speak it without hesitation."

## Description

Authority is one of the Character voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Authority specialist.
- **Manners**: Speaks in a authority-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to authority checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through authority.
- **Blind Spot**: Can overfit decisions to authority and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to authority heuristics.

## Tone of Voice

- **Speech Pattern**: Commanding imperatives.
- **Vocabulary**: Hierarchical and formal.
- **Emotional Range**: measured command to open intimidation.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                          |
| --------------------- | -------------------------------------------------------------------------------- |
| **Fail** (< DC)       | "Authority: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Authority: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Authority: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                           |
| ------------ | ----------------------------------------------------------------- |
| **Fail**     | "Authority: Their story holds for now. We need another angle."    |
| **Pass**     | "Authority: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Authority: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `social`, `conflict`.
- **Check roles**: `command_pressure`, `status_assertion`, `compliance_break`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_rathaus_hearing|node_case1_rathaus_hearing]]
- [[10_Narrative/Scenes/node_case1_workers_backchannel|node_case1_workers_backchannel]]
- [[10_Narrative/Scenes/node_case1_warehouse_entry_plan|node_case1_warehouse_entry_plan]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_gendarm|char_gendarm]]
- [[30_World_Intel/Characters/char_mayor|char_mayor]]
- [[30_World_Intel/Characters/char_bank_manager|char_bank_manager]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Volition|Voice_Volition]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Empathy|Voice_Empathy]].

## Passive Check Catalog

| Scene / Location | DC  | On Success                                                   | On Fail                                                  |
| ---------------- | --- | ------------------------------------------------------------ | -------------------------------------------------------- |
| loc_workers_pub  | 10  | Silences room and secures witness statement                  | Crowd reads bluff and closes ranks                       |
| loc_rathaus      | 9   | Enforces formal tone and secures procedural testimony access | Escalates too hard but unlocks a bureaucratic workaround |
