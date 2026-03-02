---
id: voice_perception
tags:
  - mechanic
  - voice
voice_id: perception
department: Brain
readiness: production
persona_archetype: "Perception specialist"
persona_manners: "Speaks in a perception-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to perception checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through perception."
persona_blind_spot: "Can overfit decisions to perception and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to perception heuristics."
gameplay_primary_loops:
  - investigation
  - exploration
gameplay_check_roles:
  - microdetail_pickup
  - body_language_read
  - environmental_scan
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_hbf_arrival
  - node_case1_bank_investigation
  - node_case1_lead_tailor
case01_character_hooks:
  - char_clerk
  - char_gendarm
  - char_assistant
aliases:
  - Wahrnehmung
---

# Voice: Perception

> "Look again. The detail is never where pride points."

## Description

Perception is one of the Brain voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Perception specialist.
- **Manners**: Speaks in a perception-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to perception checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through perception.
- **Blind Spot**: Can overfit decisions to perception and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to perception heuristics.

## Tone of Voice

- **Speech Pattern**: Short sensory fragments.
- **Vocabulary**: Concrete visual cues.
- **Emotional Range**: curious focus to paranoid fixation.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                           |
| --------------------- | --------------------------------------------------------------------------------- |
| **Fail** (< DC)       | "Perception: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Perception: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Perception: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                            |
| ------------ | ------------------------------------------------------------------ |
| **Fail**     | "Perception: Their story holds for now. We need another angle."    |
| **Pass**     | "Perception: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Perception: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `investigation`, `exploration`.
- **Check roles**: `microdetail_pickup`, `body_language_read`, `environmental_scan`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_hbf_arrival|node_case1_hbf_arrival]]
- [[10_Narrative/Scenes/node_case1_bank_investigation|node_case1_bank_investigation]]
- [[10_Narrative/Scenes/node_case1_lead_tailor|node_case1_lead_tailor]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_clerk|char_clerk]]
- [[30_World_Intel/Characters/char_gendarm|char_gendarm]]
- [[30_World_Intel/Characters/char_assistant|char_assistant]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Logic|Voice_Logic]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Imagination|Voice_Imagination]].

## Passive Check Catalog

| Scene / Location | DC  | On Success                                            | On Fail                                                       |
| ---------------- | --- | ----------------------------------------------------- | ------------------------------------------------------------- |
| loc_tailor       | 7   | Notices hidden seam pocket and chalk mark             | Misses textile code stitched in hem                           |
| loc_hauptbahnhof | 8   | Spots a repeated porter route and points to a witness | Loses visual continuity but marks a sector for a second sweep |
