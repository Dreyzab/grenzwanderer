---
id: scene_son_house_ch2
type: vn_choice
parent: scene_son_house
choice_id: SON_HOUSE_WARDROBE
tags:
  - type/vn_choice
  - case/sandbox_banker
---

# Choice: Проверить гардероб и сундук

## Choice Contract v1

- `choice_id`: `SON_HOUSE_WARDROBE`
- `gating_check`: none
- `success_effect`: `clue_CLUE_B02_PAWN_RECEIPT = true`
- `fail_effect`: получает только часть сведений о залоге
- `next_node`: `scene_bank_leads`

## State Delta

- `clue_CLUE_B02_PAWN_RECEIPT = true`
- `banker_house_wardrobe_checked = true`

## Next

[[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_leads|scene_bank_leads]]
