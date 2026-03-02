---
id: action_inspect_vault
aliases:
  - Action: Inspect Vault
tags:
  - type/vn_action
  - layer/vn
  - case/case01
  - phase/bank_investigation
---

# 🔐 Action: Inspect Vault

## Context

**Location**: Inside the Vault.
**Atmosphere**: "Intact mechanism. Empty boxes. Traces remain."

## 🧩 Active Checks

### 1. Lock Mechanism

- **Check**: [[Voice_Logic|Logic (DC 10)]]
- **Description**: Analyze lock operation.
- **Success**: "No brute force. Controlled access."
- **Reward**: [[40_GameViewer/Case01/_Evidence/ev_torn_velvet|Clue: Torn Velvet]] (Red theatrical quality).

### 2. Atmosphere / Smell

- **Check**: [[Voice_Intuition|Intuition (DC 12)]]
- **Description**: Read the room for irregularities.
- **Success**: "Bitter almond note. Industrial powder."
- **Reward**: [[40_GameViewer/Case01/_Evidence/ev_chemical_residue|Clue: Strange Dust]]

### 3. Sender Comparison

- **Requires**: `clue_chemical_sender` (from previous/external source?)
- **Check**: [[Voice_Logic|Logic (DC 8)]]
- **Success**: "Sender means Breisgau Chemical Works."

### 4. Occult Layer (Hidden)

- **Trigger**: Finding Residue (`found_residue`).
- **Discovery**: Chalk geometry under the dust.
- **Clara's Input**: "Patterned, structured, deliberate."
- **Check**: [[Voice_Occultism|Occultism (DC 14)]]
- **Success**: "Symbol is a signature or ritual marker."
- **Reward**: [[40_GameViewer/Case01/_Evidence/ev_occult_circle|Clue: Occult Circle]]

## → Return

[[40_GameViewer/Case01/Plot/03_Bank/action_investigate_bank|🔙 Return to Bank Hub]]
