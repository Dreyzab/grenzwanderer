---
id: moc_quests
tags:
  - type/moc
  - domain/narrative
---

# MOC Quests

## Main

- [[00_Map_Room/qst_main_case_01|qst_main_case_01]]

## Side

- [[00_Map_Room/qst_victoria_poetry|qst_victoria_poetry]]
- [[00_Map_Room/qst_lotte_wires|qst_lotte_wires]]
- [[00_Map_Room/qst_inspector_vienna|qst_inspector_vienna]]
- [[00_Map_Room/qst_dead_registry|qst_dead_registry]]

## Karlsruhe Sandbox (ka1905)

- [[00_Map_Room/qst_sandbox_karlsruhe|qst_sandbox_karlsruhe]] — Meta quest
- [[00_Map_Room/qst_sandbox_banker|qst_sandbox_banker]] — Banker's Son (card duel)
- [[00_Map_Room/qst_sandbox_dog|qst_sandbox_dog]] — Mayor's Dog (optional, breadcrumbs)
- [[00_Map_Room/qst_sandbox_ghost|qst_sandbox_ghost]] — Haunted Estate (deduction)

## Karlsruhe Sandbox Flow

```mermaid
flowchart TD
    A[QR Entry ka1905] --> B[Onboarding]
    B --> C[sandbox_intro VN]
    C --> D[Banker's Son]
    C --> E[Haunted Estate]
    C --> F[Mayor's Dog]
    D --> G[⚔️ Card Duel]
    E --> H[🔬 Evidence Combining]
    F --> I[🐕 Bruno Found]
    G --> J[Sandbox Complete]
    H --> J
    I -.-> J
```

## Case 01 Stage Flow

```mermaid
flowchart TD
  A[start_game] --> B[intro_char_creation]
  B --> C[telegram_gate]
  C --> D[case1_alt_briefing]
  D --> E[map_action_bank]
  E --> F[bank_investigation]
  F --> G[first_lead_selection]
  G --> H[lead_tailor]
  G --> I[lead_apothecary]
  G --> J[lead_pub]
  H --> K[mid_case_web]
  I --> K
  J --> K
```

## Side Quest Hooks

```mermaid
flowchart LR
  A[node_case1_first_lead_selection] --> B[qst_victoria_poetry]
  A --> C[qst_lotte_wires]
  F[node_case1_bank_investigation] --> D[qst_inspector_vienna]
  F --> E[qst_dead_registry]
```
