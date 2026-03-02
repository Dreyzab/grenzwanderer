---
id: voice_endurance
tags:
  - mechanic
  - voice
voice_id: endurance
department: Body
readiness: production
persona_archetype: "Endurance specialist"
persona_manners: "Speaks in a endurance-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to endurance checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through endurance."
persona_blind_spot: "Can overfit decisions to endurance and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to endurance heuristics."
gameplay_primary_loops:
  - exploration
  - conflict
gameplay_check_roles:
  - pain_gate
  - fatigue_resist
  - long_push
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_map_first_exploration
  - node_case1_rail_yard_shadow_tail
  - node_case1_warehouse_entry_plan
case01_character_hooks:
  - char_enforcer
  - char_warehouse_guard
  - char_dock_worker
aliases:
  - Ausdauer
---

# Voice: Endurance

> "Pain is information, not authority."

## Description

Endurance is one of the Body voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Endurance specialist.
- **Manners**: Speaks in a endurance-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to endurance checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through endurance.
- **Blind Spot**: Can overfit decisions to endurance and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to endurance heuristics.

## Tone of Voice

- **Speech Pattern**: Brutal pragmatism.
- **Vocabulary**: Physical and gritty.
- **Emotional Range**: stoic grit to self-destructive push.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                          |
| --------------------- | -------------------------------------------------------------------------------- |
| **Fail** (< DC)       | "Endurance: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Endurance: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Endurance: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                           |
| ------------ | ----------------------------------------------------------------- |
| **Fail**     | "Endurance: Their story holds for now. We need another angle."    |
| **Pass**     | "Endurance: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Endurance: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `exploration`, `conflict`.
- **Check roles**: `pain_gate`, `fatigue_resist`, `long_push`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_map_first_exploration|node_case1_map_first_exploration]]
- [[10_Narrative/Scenes/node_case1_rail_yard_shadow_tail|node_case1_rail_yard_shadow_tail]]
- [[10_Narrative/Scenes/node_case1_warehouse_entry_plan|node_case1_warehouse_entry_plan]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_enforcer|char_enforcer]]
- [[30_World_Intel/Characters/char_warehouse_guard|char_warehouse_guard]]
- [[30_World_Intel/Characters/char_dock_worker|char_dock_worker]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Volition|Voice_Volition]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Empathy|Voice_Empathy]].

## Passive Check Catalog

| Scene / Location         | DC  | On Success                                                  | On Fail                                                        |
| ------------------------ | --- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| loc_freiburg_warehouse   | 9   | Keeps searching despite cold and fatigue                    | Stops before finding crate mark                                |
| loc_stuhlinger_warehouse | 10  | Absorbs environmental pressure and keeps the clue run alive | Takes resource loss but transitions into a safe fallback route |
