---
id: voice_gambling
tags:
  - mechanic
  - voice
voice_id: gambling
department: Spirit
readiness: production
persona_archetype: "Gambling specialist"
persona_manners: "Speaks in a gambling-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to gambling checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through gambling."
persona_blind_spot: "Can overfit decisions to gambling and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to gambling heuristics."
gameplay_primary_loops:
  - economy
  - social
  - conflict
gameplay_check_roles:
  - risk_bet
  - odds_read
  - high_stake_push
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_first_lead_selection
  - node_case1_lead_pub
  - node_case1_workers_backchannel
case01_character_hooks:
  - char_pawnbroker
  - char_smuggler
  - char_journalist
aliases:
  - Glücksspiel
---

# Voice: Gambling

> "Fortune favors pressure applied at the right second."

## Description

Gambling is one of the Spirit voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Gambling specialist.
- **Manners**: Speaks in a gambling-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to gambling checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through gambling.
- **Blind Spot**: Can overfit decisions to gambling and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to gambling heuristics.

## Tone of Voice

- **Speech Pattern**: Provocative dare.
- **Vocabulary**: Odds, stakes, leverage.
- **Emotional Range**: playful risk to reckless escalation.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                         |
| --------------------- | ------------------------------------------------------------------------------- |
| **Fail** (< DC)       | "Gambling: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Gambling: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Gambling: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                          |
| ------------ | ---------------------------------------------------------------- |
| **Fail**     | "Gambling: Their story holds for now. We need another angle."    |
| **Pass**     | "Gambling: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Gambling: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `economy`, `social`, `conflict`.
- **Check roles**: `risk_bet`, `odds_read`, `high_stake_push`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- [[10_Narrative/Scenes/node_case1_lead_pub|node_case1_lead_pub]]
- [[10_Narrative/Scenes/node_case1_workers_backchannel|node_case1_workers_backchannel]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_pawnbroker|char_pawnbroker]]
- [[30_World_Intel/Characters/char_smuggler|char_smuggler]]
- [[30_World_Intel/Characters/char_journalist|char_journalist]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Deception|Voice_Deception]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Volition|Voice_Volition]].

## Passive Check Catalog

| Scene / Location | DC  | On Success                                                        | On Fail                                                    |
| ---------------- | --- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| loc_workers_pub  | 8   | Baits suspect into overcommitting                                 | Pushes too far and burns contact                           |
| loc_workers_pub  | 8   | Takes a calculated social risk and gains fast access to key intel | Loses leverage but opens a slower paid-information channel |
