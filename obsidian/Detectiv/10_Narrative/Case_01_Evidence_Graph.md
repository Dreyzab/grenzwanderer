---
id: case_01_evidence_graph
tags:
  - type/graph
  - domain/narrative
  - case/case01
---

# Case 01 Evidence Graph

## Core Links

```mermaid
flowchart TD
  A[clue_sleep_agent] --> B[Lead: Apothecary sedation profile]
  C[clue_lock_signature] --> D[Lead: Tailor heat-tool sourcing]
  E[clue_relic_gap] --> F[Lead: Transfer motive branches]
  G[clue_hidden_slot] --> H[Lead: Pub route verification]

  I[clue_sender_residue_match] --> J[clue_sender_route_to_kiliani]
  K[clue_hartmann_internal_contact] --> L[clue_hartmann_tailor_route]
  K --> M[clue_hartmann_cash_runner]

  B --> N[Bundle: Chemical Trail]
  D --> O[Bundle: Identity Trail]
  H --> P[Bundle: Logistics Trail]
  F --> N
  F --> O
  F --> P

  N --> Q[Convergence Gate]
  O --> Q
  P --> Q
```

## Node Anchors

- [[10_Narrative/Scenes/node_case1_bank_investigation|node_case1_bank_investigation]]
- [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- [[10_Narrative/Scenes/node_case1_lead_tailor|node_case1_lead_tailor]]
- [[10_Narrative/Scenes/node_case1_lead_apothecary|node_case1_lead_apothecary]]
- [[10_Narrative/Scenes/node_case1_lead_pub|node_case1_lead_pub]]
