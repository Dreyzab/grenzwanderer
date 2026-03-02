---
id: voice_agility
tags:
  - mechanic
  - voice
voice_id: agility
department: Body
readiness: production
persona_archetype: "Agility specialist"
persona_manners: "Speaks in a agility-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to agility checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through agility."
persona_blind_spot: "Can overfit decisions to agility and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to agility heuristics."
gameplay_primary_loops:
  - exploration
  - conflict
  - investigation
gameplay_check_roles:
  - timing_window
  - chase_control
  - position_shift
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_rail_yard_shadow_tail
  - node_case1_qr_scan_bank
  - node_case1_lead_tailor
case01_character_hooks:
  - char_smuggler
  - char_student_leader
  - char_warehouse_guard
aliases:
  - Agilitaet
---

# Voice: Agility

> "Momentum is evidence. Control the angle."

## Description

Agility is one of the Body voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Agility specialist.
- **Manners**: Speaks in a agility-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to agility checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through agility.
- **Blind Spot**: Can overfit decisions to agility and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to agility heuristics.

## Tone of Voice

- **Speech Pattern**: Fast tactical cues.
- **Vocabulary**: Movement and timing.
- **Emotional Range**: playful precision to panic speed.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                        |
| --------------------- | ------------------------------------------------------------------------------ |
| **Fail** (< DC)       | "Agility: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Agility: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Agility: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                         |
| ------------ | --------------------------------------------------------------- |
| **Fail**     | "Agility: Their story holds for now. We need another angle."    |
| **Pass**     | "Agility: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Agility: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `exploration`, `conflict`, `investigation`.
- **Check roles**: `timing_window`, `chase_control`, `position_shift`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_rail_yard_shadow_tail|node_case1_rail_yard_shadow_tail]]
- [[10_Narrative/Scenes/node_case1_qr_scan_bank|node_case1_qr_scan_bank]]
- [[10_Narrative/Scenes/node_case1_lead_tailor|node_case1_lead_tailor]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_smuggler|char_smuggler]]
- [[30_World_Intel/Characters/char_student_leader|char_student_leader]]
- [[30_World_Intel/Characters/char_warehouse_guard|char_warehouse_guard]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Stealth|Voice_Stealth]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Endurance|Voice_Endurance]].

## Passive Check Catalog

| Scene / Location | DC  | On Success                                                    | On Fail                                                |
| ---------------- | --- | ------------------------------------------------------------- | ------------------------------------------------------ |
| loc_martinstor   | 7   | Cuts through tram flow unnoticed                              | Missteps and draws attention                           |
| loc_hauptbahnhof | 8   | Times the flow and reaches the right platform ahead of target | Misses pace but maps a safer lane for a second attempt |
