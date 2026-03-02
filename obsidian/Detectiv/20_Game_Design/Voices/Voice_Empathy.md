---
id: voice_empathy
tags:
  - mechanic
  - voice
voice_id: empathy
department: Soul
readiness: production
persona_archetype: "Empathy specialist"
persona_manners: "Speaks in a empathy-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to empathy checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through empathy."
persona_blind_spot: "Can overfit decisions to empathy and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to empathy heuristics."
gameplay_primary_loops:
  - social
  - investigation
gameplay_check_roles:
  - fear_read
  - rapport_build
  - confession_pressure
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_bank_investigation
  - node_case1_lead_pub
  - node_case1_workers_backchannel
case01_character_hooks:
  - char_clerk
  - char_bank_manager
  - char_pub_owner
aliases:
  - Empathie
---

# Voice: Empathy

> "Pain leaks through posture long before confession."

## Description

Empathy is one of the Soul voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Empathy specialist.
- **Manners**: Speaks in a empathy-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to empathy checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through empathy.
- **Blind Spot**: Can overfit decisions to empathy and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to empathy heuristics.

## Tone of Voice

- **Speech Pattern**: Soft and observant.
- **Vocabulary**: Emotional and relational.
- **Emotional Range**: gentle concern to protective anger.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                        |
| --------------------- | ------------------------------------------------------------------------------ |
| **Fail** (< DC)       | "Empathy: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Empathy: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Empathy: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                         |
| ------------ | --------------------------------------------------------------- |
| **Fail**     | "Empathy: Their story holds for now. We need another angle."    |
| **Pass**     | "Empathy: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Empathy: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `social`, `investigation`.
- **Check roles**: `fear_read`, `rapport_build`, `confession_pressure`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_bank_investigation|node_case1_bank_investigation]]
- [[10_Narrative/Scenes/node_case1_lead_pub|node_case1_lead_pub]]
- [[10_Narrative/Scenes/node_case1_workers_backchannel|node_case1_workers_backchannel]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_clerk|char_clerk]]
- [[30_World_Intel/Characters/char_bank_manager|char_bank_manager]]
- [[30_World_Intel/Characters/char_pub_owner|char_pub_owner]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Intuition|Voice_Intuition]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Authority|Voice_Authority]].

## Passive Check Catalog

| Scene / Location  | DC  | On Success                                              | On Fail                                                         |
| ----------------- | --- | ------------------------------------------------------- | --------------------------------------------------------------- |
| loc_freiburg_bank | 6   | Reads suppressed panic under formal tone                | Takes rehearsed composure at face value                         |
| loc_pub           | 7   | Detects hidden fear and extracts a soft but useful lead | The target closes emotionally, but neutral contact remains open |
