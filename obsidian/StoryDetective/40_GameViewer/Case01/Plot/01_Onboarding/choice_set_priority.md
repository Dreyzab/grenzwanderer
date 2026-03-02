---
id: choice_set_priority
type: vn_choice
phase: onboarding
status: active
tags:
  - type/vn_choice
  - layer/vn
  - case/case01
---

# Decision: Set Priority

## Narrative

Fritz lays out two urgent fronts: the bank robbery and the political pressure
from Rathaus. You choose what burns first.

## Choices

1. Bank first.
   - Sets `priority_bank_first` = true
   - Unlocks [[loc_freiburg_bank]]
   - Next: [[map_transit]]
2. Mayor first.
   - Sets `priority_mayor_first` = true
   - Unlocks [[loc_rathaus]]
   - Next: [[map_transit]]
