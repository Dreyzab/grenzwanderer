---
id: scene_son_house_ch1
type: vn_choice
parent: scene_son_house
choice_id: SON_HOUSE_DESK
tags:
  - type/vn_choice
  - case/sandbox_banker
---

# Choice: Осмотреть стол и бумаги

## Choice Contract v1

- `choice_id`: `SON_HOUSE_DESK`
- `gating_check`: none
- `success_effect`: `clue_CLUE_B01_DEBT_NOTE = true`
- `fail_effect`: `clue_CLUE_B01_DEBT_NOTE = partial`
- `next_node`: `scene_bank_leads`

## State Delta

- `clue_CLUE_B01_DEBT_NOTE = true`
- `banker_house_desk_checked = true`

## Next

[[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_leads|scene_bank_leads]]
