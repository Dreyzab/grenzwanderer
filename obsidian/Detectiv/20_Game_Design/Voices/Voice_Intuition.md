---
id: voice_intuition
tags:
  - mechanic
  - voice
voice_id: intuition
department: Soul
readiness: production
persona_archetype: "Intuition specialist"
persona_manners: "Speaks in a intuition-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to intuition checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through intuition."
persona_blind_spot: "Can overfit decisions to intuition and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to intuition heuristics."
gameplay_primary_loops:
  - investigation
  - social
  - meta
gameplay_check_roles:
  - risk_sense
  - pressure_forecast
  - threat_hint
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_qr_scan_bank
  - node_case1_bank_investigation
  - node_case1_workers_backchannel
case01_character_hooks:
  - char_unknown
  - char_journalist
  - char_operator
aliases:
  - Intuition
---

# Voice: Intuition

> "Something is off before the facts arrive."

## Description

Intuition is one of the Soul voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Intuition specialist.
- **Manners**: Speaks in a intuition-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to intuition checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through intuition.
- **Blind Spot**: Can overfit decisions to intuition and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to intuition heuristics.

## Tone of Voice

- **Speech Pattern**: Warning whispers.
- **Vocabulary**: Metaphor and omen.
- **Emotional Range**: calm warning to urgent alarm.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                          |
| --------------------- | -------------------------------------------------------------------------------- |
| **Fail** (< DC)       | "Intuition: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Intuition: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Intuition: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                           |
| ------------ | ----------------------------------------------------------------- |
| **Fail**     | "Intuition: Their story holds for now. We need another angle."    |
| **Pass**     | "Intuition: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Intuition: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `investigation`, `social`, `meta`.
- **Check roles**: `risk_sense`, `pressure_forecast`, `threat_hint`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_qr_scan_bank|node_case1_qr_scan_bank]]
- [[10_Narrative/Scenes/node_case1_bank_investigation|node_case1_bank_investigation]]
- [[10_Narrative/Scenes/node_case1_workers_backchannel|node_case1_workers_backchannel]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_unknown|char_unknown]]
- [[30_World_Intel/Characters/char_journalist|char_journalist]]
- [[30_World_Intel/Characters/char_operator|char_operator]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Empathy|Voice_Empathy]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Logic|Voice_Logic]].

## Passive Check Catalog

| Scene / Location | DC  | On Success                                                    | On Fail                                                      |
| ---------------- | --- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| loc_red_light    | 8   | Flags ambush route before contact                             | Mistakes anxiety for danger                                  |
| loc_workers_pub  | 8   | Reads a mood swing in the room and surfaces a nervous contact | Over-reads tension but sets a clean timing window for return |
