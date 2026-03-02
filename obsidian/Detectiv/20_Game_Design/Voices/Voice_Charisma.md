---
id: voice_charisma
tags:
  - mechanic
  - voice
voice_id: charisma
department: Character
readiness: production
persona_archetype: "Charisma specialist"
persona_manners: "Speaks in a charisma-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to charisma checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through charisma."
persona_blind_spot: "Can overfit decisions to charisma and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to charisma heuristics."
gameplay_primary_loops:
  - social
  - economy
  - investigation
gameplay_check_roles:
  - rapport_open
  - negotiation_soften
  - social_tradeoff
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_first_lead_selection
  - node_case1_lead_pub
  - node_case1_lead_apothecary
case01_character_hooks:
  - char_journalist
  - char_pub_owner
  - char_pawnbroker
aliases:
  - Charisma
---

# Voice: Charisma

> "Make them enjoy telling you what hurts them."

## Description

Charisma is one of the Character voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Charisma specialist.
- **Manners**: Speaks in a charisma-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to charisma checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through charisma.
- **Blind Spot**: Can overfit decisions to charisma and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to charisma heuristics.

## Tone of Voice

- **Speech Pattern**: Warm and adaptive.
- **Vocabulary**: Social and flattering.
- **Emotional Range**: light charm to predatory allure.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                         |
| --------------------- | ------------------------------------------------------------------------------- |
| **Fail** (< DC)       | "Charisma: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Charisma: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Charisma: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                          |
| ------------ | ---------------------------------------------------------------- |
| **Fail**     | "Charisma: Their story holds for now. We need another angle."    |
| **Pass**     | "Charisma: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Charisma: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `social`, `economy`, `investigation`.
- **Check roles**: `rapport_open`, `negotiation_soften`, `social_tradeoff`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- [[10_Narrative/Scenes/node_case1_lead_pub|node_case1_lead_pub]]
- [[10_Narrative/Scenes/node_case1_lead_apothecary|node_case1_lead_apothecary]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_journalist|char_journalist]]
- [[30_World_Intel/Characters/char_pub_owner|char_pub_owner]]
- [[30_World_Intel/Characters/char_pawnbroker|char_pawnbroker]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Deception|Voice_Deception]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Logic|Voice_Logic]].

## Passive Check Catalog

| Scene / Location | DC  | On Success                                                 | On Fail                                                               |
| ---------------- | --- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| loc_pub          | 7   | Turns rumor into actionable lead                           | Gets entertainment, not information                                   |
| loc_workers_pub  | 10  | Converts rumor into a testable lead through social rapport | Gets noise instead of detail, but preserves a reusable social channel |
