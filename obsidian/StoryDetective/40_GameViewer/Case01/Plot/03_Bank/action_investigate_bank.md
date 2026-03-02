---
id: action_investigate_bank
aliases:
  - Hub: Bank Main Hall
tags:
  - type/map_hub
  - layer/vn
  - case/case01
  - phase/bank_investigation
---

# 🕵️ Hub: Bank Main Hall

## Context

**Location**: Bankhaus J.A. Krebs - Main Hall.
**Source Logic**: `case1_bank.logic.ts` (Scene: `bank_hub`)

## Description

"Die große Halle des Bankhauses Krebs ist ungewöhnlich still. Herr [[char_bank_manager|Galdermann]] steht bei seinem Büro. Ein nervöser Angestellter zappelt am Schalter. Die schwere Tresortür steht einen Spalt offen."

## Available Actions

### 1. Speak with Manager (`speak_manager`)

- **Target**: [[scene_manager_dialogue|Herr Galdermann]]
- **Type**: Inquiry

### 2. Speak with Clerk (`speak_clerk`)

- **Target**: [[scene_clerk_dialogue|Angestellter (Ernst Vogel)]]
- **Type**: Inquiry

### 3. Inspect Vault (`inspect_vault`)

- **Target**: [[scene_vault_inspection|Tresor]]
- **Type**: Investigation

### 4. Conclude Investigation (`conclude_investigation`)

- **Target**: [[scene_bank_conclusion|Abschluss]]
- **Condition**: `vault_inspected` AND `clerk_interviewed` - "Ich habe hier genug gesehen."
