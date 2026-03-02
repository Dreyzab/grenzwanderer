---
id: clue_chemical_sender
aliases:
  - Chemical Sender Clue
  - Sender Residue
tags:
  - type/evidence
  - category/clue
  - case/case01
  - source/bank
---

# clue_chemical_sender

## Description

Химические следы на конверте из банковской ячейки. Указывают на аптекаря как отправителя.

## Acquisition

- **Scene**: [[10_Narrative/Scenes/node_case1_bank_investigation|Bank Investigation]]
- **Check**: Passive `senses` or active investigation
- **Flag set**: `clue_chemical_sender`

## Gameplay Impact

- Unlocks Chemical Trail in lead selection
- Extra dialogue options in Apothecary lead
- Strengthens evidence in finale confrontation

## Related

- [[30_World_Intel/Characters/char_apothecary|Apothecary (Kiliani)]]
- [[30_World_Intel/Items/clue_sender_route_to_kiliani|clue_sender_route_to_kiliani]]
- [[10_Narrative/Scenes/node_case1_lead_apothecary|Apothecary Lead]]
