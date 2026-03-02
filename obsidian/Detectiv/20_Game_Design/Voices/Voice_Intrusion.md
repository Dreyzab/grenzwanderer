---
id: voice_intrusion
tags:
  - mechanic
  - voice
voice_id: intrusion
department: Shadow
readiness: production
persona_archetype: "Intrusion specialist"
persona_manners: "Speaks in a intrusion-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to intrusion checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through intrusion."
persona_blind_spot: "Can overfit decisions to intrusion and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to intrusion heuristics."
gameplay_primary_loops:
  - investigation
  - exploration
  - conflict
gameplay_check_roles:
  - lock_bypass
  - entry_engineering
  - security_probe
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_archive_warrant_run
  - node_case1_warehouse_entry_plan
  - node_case1_lead_tailor
case01_character_hooks:
  - char_archive_keeper
  - char_enforcer
  - char_tailor_master
aliases:
  - Einbruch
---

# Voice: Intrusion

> "Every lock already contains its own confession."

## Description

Intrusion is one of the Shadow voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Intrusion specialist.
- **Manners**: Speaks in a intrusion-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to intrusion checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through intrusion.
- **Blind Spot**: Can overfit decisions to intrusion and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to intrusion heuristics.

## Tone of Voice

- **Speech Pattern**: Procedural lock-talk.
- **Vocabulary**: Tools, mechanisms, tolerances.
- **Emotional Range**: patient precision to compulsive forcing.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                          |
| --------------------- | -------------------------------------------------------------------------------- |
| **Fail** (< DC)       | "Intrusion: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Intrusion: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Intrusion: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                           |
| ------------ | ----------------------------------------------------------------- |
| **Fail**     | "Intrusion: Their story holds for now. We need another angle."    |
| **Pass**     | "Intrusion: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Intrusion: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `investigation`, `exploration`, `conflict`.
- **Check roles**: `lock_bypass`, `entry_engineering`, `security_probe`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_archive_warrant_run|node_case1_archive_warrant_run]]
- [[10_Narrative/Scenes/node_case1_warehouse_entry_plan|node_case1_warehouse_entry_plan]]
- [[10_Narrative/Scenes/node_case1_lead_tailor|node_case1_lead_tailor]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_archive_keeper|char_archive_keeper]]
- [[30_World_Intel/Characters/char_enforcer|char_enforcer]]
- [[30_World_Intel/Characters/char_tailor_master|char_tailor_master]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Logic|Voice_Logic]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Tradition|Voice_Tradition]].

## Passive Check Catalog

| Scene / Location     | DC  | On Success                                                       | On Fail                                            |
| -------------------- | --- | ---------------------------------------------------------------- | -------------------------------------------------- |
| loc_tailor           | 9   | Opens hidden cabinet without trace                               | Snaps pick and leaves fresh mark                   |
| loc_freiburg_archive | 10  | Breaches a restricted channel and secures hidden document access | Leaves traces but unlocks a legal request fallback |
