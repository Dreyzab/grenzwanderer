---
id: scene_tavern_ch1
type: vn_choice
parent: scene_tavern
choice_id: TAVERN_BRIBE_INFO
tags:
  - type/vn_choice
  - case/sandbox_banker
---

# Choice: Подкупить бармена

## Choice Contract v1

- `choice_id`: `TAVERN_BRIBE_INFO`
- `gating_check`: `money >= 10`
- `success_effect`: `clue_CLUE_B03_TAVERN_TESTIMONY = true`
- `fail_effect`: `money_spent = true`, улика неполная
- `next_node`: `scene_bank_leads`

## State Delta

- `banker_tavern_bribe_used = true`
- `clue_CLUE_B03_TAVERN_TESTIMONY = true`

## Next

[[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_leads|scene_bank_leads]]
