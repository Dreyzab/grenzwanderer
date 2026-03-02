---
id: voice_volition
tags:
  - mechanic
  - voice
voice_id: volition
department: Character
readiness: production
persona_archetype: "Volition specialist"
persona_manners: "Speaks in a volition-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to volition checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through volition."
persona_blind_spot: "Can overfit decisions to volition and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to volition heuristics."
gameplay_primary_loops:
  - meta
  - conflict
  - social
gameplay_check_roles:
  - composure_hold
  - panic_suppression
  - resolve_lock
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_telegram_gate_after_creation
  - node_case1_bank_investigation
  - node_case1_finale_resolution_split
case01_character_hooks:
  - char_inspector
  - char_assistant
  - char_operator
aliases:
  - Volition
---

# Voice: Volition

> "Hold the line. You do not dissolve here."

## Description

Volition is one of the Character voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Volition specialist.
- **Manners**: Speaks in a volition-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to volition checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through volition.
- **Blind Spot**: Can overfit decisions to volition and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to volition heuristics.

## Tone of Voice

- **Speech Pattern**: Grounded self-talk.
- **Vocabulary**: Direct and stabilizing.
- **Emotional Range**: quiet discipline to hard refusal.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                         |
| --------------------- | ------------------------------------------------------------------------------- |
| **Fail** (< DC)       | "Volition: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Volition: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Volition: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                          |
| ------------ | ---------------------------------------------------------------- |
| **Fail**     | "Volition: Their story holds for now. We need another angle."    |
| **Pass**     | "Volition: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Volition: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `meta`, `conflict`, `social`.
- **Check roles**: `composure_hold`, `panic_suppression`, `resolve_lock`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_telegram_gate_after_creation|node_telegram_gate_after_creation]]
- [[10_Narrative/Scenes/node_case1_bank_investigation|node_case1_bank_investigation]]
- [[10_Narrative/Scenes/node_case1_finale_resolution_split|node_case1_finale_resolution_split]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_inspector|char_inspector]]
- [[30_World_Intel/Characters/char_assistant|char_assistant]]
- [[30_World_Intel/Characters/char_operator|char_operator]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Authority|Voice_Authority]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Imagination|Voice_Imagination]].

## Passive Check Catalog

| Scene / Location     | DC  | On Success                                                 | On Fail                                                         |
| -------------------- | --- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| loc_telephone        | 8   | Resists manipulation and keeps objective                   | Accepts emotional bait and drifts                               |
| loc_freiburg_archive | 8   | Keeps composure long enough to secure a baseline statement | Cracks under pressure but leaves a document trace for follow-up |
