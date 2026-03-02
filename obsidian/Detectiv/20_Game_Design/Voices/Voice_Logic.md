---
id: voice_logic
tags:
  - mechanic
  - voice
voice_id: logic
department: Brain
readiness: production
persona_archetype: "Logic specialist"
persona_manners: "Speaks in a logic-driven framing with concise tactical observations."
persona_knowledge: "Primary domain knowledge tied to logic checks and narrative pressure."
persona_philosophy: "Truth is actionable when filtered through logic."
persona_blind_spot: "Can overfit decisions to logic and underweight alternative angles."
persona_core_drive: "Convert uncertainty into a playable lead without hard dead-ends."
persona_stress_pattern: "Under pressure becomes rigid and narrows to logic heuristics."
gameplay_primary_loops:
  - investigation
  - social
gameplay_check_roles:
  - contradiction_scan
  - timeline_reconstruction
  - evidence_validation
gameplay_fail_forward: "Failure adds cost, delay, or risk but preserves forward momentum and a recovery route."
case01_node_hooks:
  - node_case1_bank_investigation
  - node_case1_first_lead_selection
  - node_case1_archive_warrant_run
case01_character_hooks:
  - char_inspector
  - char_bank_manager
  - char_clerk
aliases:
  - Logik
---

# Voice: Logic

> "The world is a machine. Find the fault line."

## Description

Logic is one of the Brain voices in the Inner Parliament. It frames detective choices in its own domain and can surface passive checks in scenes and map locations.

## Narrative Core

- **Character**: Logic specialist.
- **Manners**: Speaks in a logic-driven framing with concise tactical observations.
- **Knowledge**: Primary domain knowledge tied to logic checks and narrative pressure.
- **Philosophy**: Truth is actionable when filtered through logic.
- **Blind Spot**: Can overfit decisions to logic and underweight alternative angles.
- **Core Drive**: Convert uncertainty into a playable lead without hard dead-ends.
- **Stress Pattern**: Under pressure becomes rigid and narrows to logic heuristics.

## Tone of Voice

- **Speech Pattern**: Dry and procedural.
- **Vocabulary**: Technical and evidentiary.
- **Emotional Range**: cool certainty to surgical contempt.

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica                                                                      |
| --------------------- | ---------------------------------------------------------------------------- |
| **Fail** (< DC)       | "Logic: We have fragments, not proof. Keep moving."                          |
| **Pass** (>= DC)      | "Logic: There - one anomaly aligns with motive and timing."                  |
| **Critical** (nat 20) | "Logic: Complete pattern acquired. The scene is lying in one precise place." |

### Scene: Interrogation of a suspect

| Result       | Replica                                                       |
| ------------ | ------------------------------------------------------------- |
| **Fail**     | "Logic: Their story holds for now. We need another angle."    |
| **Pass**     | "Logic: Voice tremor at the key detail - push that fracture." |
| **Critical** | "Logic: They just confessed without saying the words."        |

## Gameplay Contract

- **Primary loops**: `investigation`, `social`.
- **Check roles**: `contradiction_scan`, `timeline_reconstruction`, `evidence_validation`.
- **Fail-forward policy**: Failure adds cost, delay, or risk but preserves forward momentum and a recovery route.
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
- [[10_Narrative/Scenes/node_case1_bank_investigation|node_case1_bank_investigation]]
- [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- [[10_Narrative/Scenes/node_case1_archive_warrant_run|node_case1_archive_warrant_run]]
- **Character hooks**:
- [[30_World_Intel/Characters/char_inspector|char_inspector]]
- [[30_World_Intel/Characters/char_bank_manager|char_bank_manager]]
- [[30_World_Intel/Characters/char_clerk|char_clerk]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_Perception|Voice_Perception]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_Empathy|Voice_Empathy]].

## Passive Check Catalog

| Scene / Location     | DC  | On Success                                          | On Fail                                               |
| -------------------- | --- | --------------------------------------------------- | ----------------------------------------------------- |
| loc_freiburg_bank    | 8   | Spots ledger mismatch and forged sequence           | Accepts clerk narrative as coherent                   |
| loc_freiburg_archive | 8   | Finds a timeline mismatch and opens an archive lead | Misreads one detail but unlocks a safe re-check route |
