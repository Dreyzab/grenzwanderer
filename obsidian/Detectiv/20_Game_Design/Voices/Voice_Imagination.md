---
id: voice_imagination
tags:
  - mechanic
  - voice
voice_id: imagination
department: Soul
readiness: production
persona_archetype: "Imagination specialist"
persona_manners: "Speaks in a imagination-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to imagination checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through imagination."
persona_blind_spot: "Can overfit decisions to imagination and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to imagination heuristics."
gameplay_primary_loops:
  - investigation
  - exploration
  - meta
gameplay_check_roles:
  - scene_reconstruction
  - hypothesis_branching
  - entry_vector_model
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_bank_investigation
  - node_case1_lead_tailor
  - node_case1_finale_resolution_split
case01_character_hooks:
  - char_inspector
  - char_assistant
  - char_unknown
aliases:
  - Imagination
---

# Voice: Imagination

> "Rebuild the night frame by frame."

## Description

Imagination is one of the Soul voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Imagination specialist.
- **Manners**: Speaks in a imagination-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to imagination checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through imagination.
- **Blind Spot**: Can overfit decisions to imagination and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to imagination heuristics.

## Tone of Voice

- **Speech Pattern**: Cinematic reconstruction.
- **Vocabulary**: Expressive and speculative.
- **Emotional Range**: playful synthesis to feverish montage.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                            |
| --------------------- | ---------------------------------------------------------------------------------- |
| **Fail** (< DC)       | "Imagination: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Imagination: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Imagination: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                             |
| ------------ | ------------------------------------------------------------------- |
| **Fail**     | "Imagination: Their story holds for now. We need another angle."    |
| **Pass**     | "Imagination: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Imagination: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `investigation`, `exploration`, `meta`.
- **Check roles**: `scene_reconstruction`, `hypothesis_branching`, `entry_vector_model`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_bank_investigation|node_case1_bank_investigation]]
- [[10_Narrative/Scenes/node_case1_lead_tailor|node_case1_lead_tailor]]
- [[10_Narrative/Scenes/node_case1_finale_resolution_split|node_case1_finale_resolution_split]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_inspector|char_inspector]]
- [[30_World_Intel/Characters/char_assistant|char_assistant]]
- [[30_World_Intel/Characters/char_unknown|char_unknown]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Perception|Voice_Perception]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Volition|Voice_Volition]].

## Passive Check Catalog

| Scene / Location         | DC  | On Success                                                    | On Fail                                                      |
| ------------------------ | --- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| loc_street_event         | 9   | Reconstructs suspect route across tram shadow                 | Overfits scene with dramatic but false thread                |
| loc_stuhlinger_warehouse | 11  | Reconstructs cargo movement and reveals a hidden entry vector | Misses one link but opens a fallback infiltration hypothesis |
