---
id: tpl_voice
tags:
  - type/template
---

# Template Voice

```md
---
id: voice_{voice_id}
tags:
  - mechanic
  - voice
voice_id: { voice_id }
department: { Brain|Soul|Character|Body|Shadow|Spirit }
readiness: production
persona_archetype: "..."
persona_manners: "..."
persona_knowledge: "..."
persona_philosophy: "..."
persona_blind_spot: "..."
persona_core_drive: "..."
persona_stress_pattern: "..."
gameplay_primary_loops:
  - investigation
  - social
gameplay_check_roles:
  - role_a
  - role_b
gameplay_fail_forward: "..."
case01_node_hooks:
  - node_case1_bank_investigation
  - node_case1_first_lead_selection
case01_character_hooks:
  - char_inspector
  - char_bank_manager
aliases:
  - { LocalizedName }
---

# Voice: {Display Name}

> "{Signature line}"

## Description

Short system description of the voice function.

## Narrative Core

- **Характер**:
- **Манеры**:
- **Знания**:
- **Философия**:
- **Слепая зона**:
- **Ядро мотивации**:
- **Поведение под стрессом**:

## Tone of Voice

- **Speech Pattern**:
- **Vocabulary**:
- **Emotional Range**:

## Example Replicas

### Scene: Discovery of a body in the bank

| Result                | Replica        |
| --------------------- | -------------- |
| **Fail** (< DC)       | "{Voice}: ..." |
| **Pass** (>= DC)      | "{Voice}: ..." |
| **Critical** (nat 20) | "{Voice}: ..." |

### Scene: Interrogation of a suspect

| Result       | Replica        |
| ------------ | -------------- |
| **Fail**     | "{Voice}: ..." |
| **Pass**     | "{Voice}: ..." |
| **Critical** | "{Voice}: ..." |

## Gameplay Contract

- **Primary loops**: `investigation`, `social`.
- **Check roles**: `role_a`, `role_b`.
- **Fail-forward policy**:
- **Critical path safety**: voice failures add cost/risk but never create mandatory dead-end.

## Case 01 Hooks

- **Node hooks**:
  - [[10_Narrative/Scenes/node_case1_bank_investigation|node_case1_bank_investigation]]
- **Character hooks**:
  - [[30_World_Intel/Characters/char_inspector|char_inspector]]

## Synergies & Conflicts

- **Synergy with**: [[20_Game_Design/Voices/Voice_{OtherA}|Voice_{OtherA}]].
- **Conflicts with**: [[20_Game_Design/Voices/Voice_{OtherB}|Voice_{OtherB}]].

## Passive Check Catalog

| Scene / Location     | DC  | On Success | On Fail |
| -------------------- | --- | ---------- | ------- |
| loc_freiburg_bank    | 8   | ...        | ...     |
| loc_freiburg_archive | 9   | ...        | ...     |
```
