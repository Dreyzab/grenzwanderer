---
id: voice_stealth
tags:
  - mechanic
  - voice
voice_id: stealth
department: Shadow
readiness: production
persona_archetype: "Stealth specialist"
persona_manners: "Speaks in a stealth-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to stealth checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through stealth."
persona_blind_spot: "Can overfit decisions to stealth and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to stealth heuristics."
gameplay_primary_loops:
  - exploration
  - investigation
  - conflict
gameplay_check_roles:
  - visibility_break
  - patrol_bypass
  - silent_positioning
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_rail_yard_shadow_tail
  - node_case1_warehouse_entry_plan
  - node_case1_archive_warrant_run
case01_character_hooks:
  - char_smuggler
  - char_warehouse_guard
  - char_enforcer
aliases:
  - Stealth
---

# Voice: Stealth

> "The best entrance is the one memory cannot replay."

## Description

Stealth is one of the Shadow voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Stealth specialist.
- **Manners**: Speaks in a stealth-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to stealth checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through stealth.
- **Blind Spot**: Can overfit decisions to stealth and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to stealth heuristics.

## Tone of Voice

- **Speech Pattern**: Low-volume directives.
- **Vocabulary**: Concealment and routes.
- **Emotional Range**: disciplined silence to predatory focus.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                        |
| --------------------- | ------------------------------------------------------------------------------ |
| **Fail** (< DC)       | "Stealth: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Stealth: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Stealth: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                         |
| ------------ | --------------------------------------------------------------- |
| **Fail**     | "Stealth: Their story holds for now. We need another angle."    |
| **Pass**     | "Stealth: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Stealth: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `exploration`, `investigation`, `conflict`.
- **Check roles**: `visibility_break`, `patrol_bypass`, `silent_positioning`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_rail_yard_shadow_tail|node_case1_rail_yard_shadow_tail]]
- [[10_Narrative/Scenes/node_case1_warehouse_entry_plan|node_case1_warehouse_entry_plan]]
- [[10_Narrative/Scenes/node_case1_archive_warrant_run|node_case1_archive_warrant_run]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_smuggler|char_smuggler]]
- [[30_World_Intel/Characters/char_warehouse_guard|char_warehouse_guard]]
- [[30_World_Intel/Characters/char_enforcer|char_enforcer]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Agility|Voice_Agility]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Authority|Voice_Authority]].

## Passive Check Catalog

| Scene / Location         | DC  | On Success                                              | On Fail                                                       |
| ------------------------ | --- | ------------------------------------------------------- | ------------------------------------------------------------- |
| loc_schwabentor          | 8   | Shifts position without triggering sentry               | Boot scrape causes patrol sweep                               |
| loc_stuhlinger_warehouse | 10  | Finds a blind patrol window and opens covert entry line | Makes noise but reveals a viable night-time fallback approach |
