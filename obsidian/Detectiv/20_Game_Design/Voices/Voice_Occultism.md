---
id: voice_occultism
tags:
  - mechanic
  - voice
voice_id: occultism
department: Spirit
readiness: production
persona_archetype: "Occultism specialist"
persona_manners: "Speaks in a occultism-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to occultism checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through occultism."
persona_blind_spot: "Can overfit decisions to occultism and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to occultism heuristics."
gameplay_primary_loops:
  - meta
  - investigation
  - exploration
gameplay_check_roles:
  - symbol_decode
  - ritual_pattern_read
  - anomaly_flag
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_bank_investigation
  - node_case1_lead_pub
  - node_case1_finale_resolution_split
case01_character_hooks:
  - char_fortune_teller
  - char_unknown
  - char_noble
aliases:
  - Okkultismus
---

# Voice: Occultism

> "Meaning hides in patterns the rational eye refuses."

## Description

Occultism is one of the Spirit voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Occultism specialist.
- **Manners**: Speaks in a occultism-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to occultism checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through occultism.
- **Blind Spot**: Can overfit decisions to occultism and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to occultism heuristics.

## Tone of Voice

- **Speech Pattern**: Ritual cadence.
- **Vocabulary**: Symbolic and esoteric.
- **Emotional Range**: measured wonder to obsessive dread.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                          |
| --------------------- | -------------------------------------------------------------------------------- |
| **Fail** (< DC)       | "Occultism: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Occultism: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Occultism: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                           |
| ------------ | ----------------------------------------------------------------- |
| **Fail**     | "Occultism: Their story holds for now. We need another angle."    |
| **Pass**     | "Occultism: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Occultism: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `meta`, `investigation`, `exploration`.
- **Check roles**: `symbol_decode`, `ritual_pattern_read`, `anomaly_flag`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_bank_investigation|node_case1_bank_investigation]]
- [[10_Narrative/Scenes/node_case1_lead_pub|node_case1_lead_pub]]
- [[10_Narrative/Scenes/node_case1_finale_resolution_split|node_case1_finale_resolution_split]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_fortune_teller|char_fortune_teller]]
- [[30_World_Intel/Characters/char_unknown|char_unknown]]
- [[30_World_Intel/Characters/char_noble|char_noble]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Tradition|Voice_Tradition]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Senses|Voice_Senses]].

## Passive Check Catalog

| Scene / Location | DC  | On Success                                                 | On Fail                                                               |
| ---------------- | --- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| loc_munster      | 10  | Decodes sigil sequence tied to syndicate rite              | Reads random ornament as omen                                         |
| loc_munster      | 10  | Decodes symbolic marker and surfaces hidden motive framing | Misreads meaning but leaves a trace for tradition-backed verification |
