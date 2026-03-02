---
id: scene_tavern_ch2
type: vn_choice
parent: scene_tavern
choice_id: TAVERN_INTIMIDATE_INFO
tags:
  - type/vn_choice
  - case/sandbox_banker
---

# Choice: Надавить на свидетеля

## Choice Contract v1

- `choice_id`: `TAVERN_INTIMIDATE_INFO`
- `gating_check`: `authority >= 2`
- `success_effect`: `clue_CLUE_B04_CROUPIER_LEDGER = true`
- `fail_effect`: `reputation_tavern = -1`, но бармен дает fallback-наводку
- `next_node`: `scene_bank_leads`

## State Delta

- `banker_tavern_intimidation_used = true`
- `clue_CLUE_B04_CROUPIER_LEDGER = true`

## Next

[[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_leads|scene_bank_leads]]
