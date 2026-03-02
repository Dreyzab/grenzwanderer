---
id: voice_deception
tags:
  - mechanic
  - voice
voice_id: deception
department: Shadow
readiness: production
persona_archetype: "Deception specialist"
persona_manners: "Speaks in a deception-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to deception checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through deception."
persona_blind_spot: "Can overfit decisions to deception and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to deception heuristics."
gameplay_primary_loops:
  - social
  - investigation
  - economy
gameplay_check_roles:
  - cover_story
  - misdirection
  - social_masking
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_workers_backchannel
  - node_case1_lead_pub
  - node_case1_rathaus_hearing
case01_character_hooks:
  - char_bank_manager
  - char_journalist
  - char_pawnbroker
aliases:
  - Täuschung
---

# Voice: Deception

> "Truth is optional. Consistency is mandatory."

## Description

Deception is one of the Shadow voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Deception specialist.
- **Manners**: Speaks in a deception-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to deception checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through deception.
- **Blind Spot**: Can overfit decisions to deception and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to deception heuristics.

## Tone of Voice

- **Speech Pattern**: Smooth improvisation.
- **Vocabulary**: Cover stories and double meanings.
- **Emotional Range**: playful bluff to cold manipulation.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                          |
| --------------------- | -------------------------------------------------------------------------------- |
| **Fail** (< DC)       | "Deception: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Deception: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Deception: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                           |
| ------------ | ----------------------------------------------------------------- |
| **Fail**     | "Deception: Their story holds for now. We need another angle."    |
| **Pass**     | "Deception: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Deception: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `social`, `investigation`, `economy`.
- **Check roles**: `cover_story`, `misdirection`, `social_masking`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_workers_backchannel|node_case1_workers_backchannel]]
- [[10_Narrative/Scenes/node_case1_lead_pub|node_case1_lead_pub]]
- [[10_Narrative/Scenes/node_case1_rathaus_hearing|node_case1_rathaus_hearing]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_bank_manager|char_bank_manager]]
- [[30_World_Intel/Characters/char_journalist|char_journalist]]
- [[30_World_Intel/Characters/char_pawnbroker|char_pawnbroker]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Charisma|Voice_Charisma]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Logic|Voice_Logic]].

## Passive Check Catalog

| Scene / Location     | DC  | On Success                                                | On Fail                                                |
| -------------------- | --- | --------------------------------------------------------- | ------------------------------------------------------ |
| loc_freiburg_archive | 9   | Sells forged authorization with confidence                | Overacts and invites document check                    |
| loc_workers_pub      | 9   | Sells a credible cover and receives closed-channel detail | Cover cracks but identifies the real access gatekeeper |
