---
id: voice_senses
tags:
  - mechanic
  - voice
voice_id: senses
department: Body
readiness: production
persona_archetype: "Senses specialist"
persona_manners: "Speaks in a senses-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to senses checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through senses."
persona_blind_spot: "Can overfit decisions to senses and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to senses heuristics."
gameplay_primary_loops:
  - investigation
  - exploration
gameplay_check_roles:
  - residue_read
  - trace_compare
  - material_signal_decode
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_bank_investigation
  - node_case1_lead_apothecary
  - node_case1_archive_warrant_run
case01_character_hooks:
  - char_assistant
  - char_apothecary
  - char_coroner
aliases:
  - Sinne
---

# Voice: Senses

> "Trust what skin and lungs already reported."

## Description

Senses is one of the Body voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Senses specialist.
- **Manners**: Speaks in a senses-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to senses checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through senses.
- **Blind Spot**: Can overfit decisions to senses and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to senses heuristics.

## Tone of Voice

- **Speech Pattern**: Embodied observations.
- **Vocabulary**: Texture, smell, pressure.
- **Emotional Range**: alert calm to sensory overload.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                       |
| --------------------- | ----------------------------------------------------------------------------- |
| **Fail** (< DC)       | "Senses: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Senses: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Senses: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                        |
| ------------ | -------------------------------------------------------------- |
| **Fail**     | "Senses: Their story holds for now. We need another angle."    |
| **Pass**     | "Senses: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Senses: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `investigation`, `exploration`.
- **Check roles**: `residue_read`, `trace_compare`, `material_signal_decode`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_bank_investigation|node_case1_bank_investigation]]
- [[10_Narrative/Scenes/node_case1_lead_apothecary|node_case1_lead_apothecary]]
- [[10_Narrative/Scenes/node_case1_archive_warrant_run|node_case1_archive_warrant_run]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_assistant|char_assistant]]
- [[30_World_Intel/Characters/char_apothecary|char_apothecary]]
- [[30_World_Intel/Characters/char_coroner|char_coroner]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Perception|Voice_Perception]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Occultism|Voice_Occultism]].

## Passive Check Catalog

| Scene / Location  | DC  | On Success                                                           | On Fail                                                       |
| ----------------- | --- | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| loc_apothecary    | 8   | Identifies ether trace on package twine                              | Strong odors mask the critical note                           |
| loc_freiburg_bank | 9   | Isolates an extra residue pattern and strengthens chemical branching | Mis-calibrates the sample but opens a repeat collection route |
