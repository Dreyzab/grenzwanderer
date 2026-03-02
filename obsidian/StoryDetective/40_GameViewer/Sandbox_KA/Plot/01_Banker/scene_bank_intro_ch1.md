---
id: scene_bank_intro_ch1
type: vn_choice
parent: scene_bank_intro
choice_id: BANK_INTRO_ACCEPT
tags:
  - type/vn_choice
  - case/sandbox_banker
---

# Choice: Принять дело без конфронтации

## Choice Contract v1

- `choice_id`: `BANK_INTRO_ACCEPT`
- `gating_check`: none
- `success_effect`: открывает хаб следов
- `fail_effect`: none
- `next_node`: `scene_bank_leads`

## State Delta

- `banker_client_cooperative = true`

## Next

[[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_leads|scene_bank_leads]]
