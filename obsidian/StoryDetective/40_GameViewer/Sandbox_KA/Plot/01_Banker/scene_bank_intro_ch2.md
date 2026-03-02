---
id: scene_bank_intro_ch2
type: vn_choice
parent: scene_bank_intro
choice_id: BANK_INTRO_PRESS_MOTIVE
tags:
  - type/vn_choice
  - case/sandbox_banker
---

# Choice: Надавить на мотивы клиента

## Choice Contract v1

- `choice_id`: `BANK_INTRO_PRESS_MOTIVE`
- `gating_check`: `logic >= 2` or `empathy >= 2`
- `success_effect`: `clue_CLUE_B05_WAX_ON_GLOVE = true`
- `fail_effect`: `banker_client_hostile = true`
- `next_node`: `scene_bank_leads`

## State Delta

- `banker_client_cooperative = false`
- `banker_case_tension = 'raised'`

## Next

[[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_leads|scene_bank_leads]]
