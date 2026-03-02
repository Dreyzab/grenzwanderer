---
id: scene_casino_duel_ch2
type: vn_choice
parent: scene_casino_duel
choice_id: CASINO_SETTLE_PRIVATE
tags:
  - type/vn_choice
  - case/sandbox_banker
---

# Choice: Закрыть дело приватно

## Choice Contract v1

- `choice_id`: `CASINO_SETTLE_PRIVATE`
- `gating_check`: `clue_CLUE_B02_PAWN_RECEIPT OR clue_CLUE_B03_TAVERN_TESTIMONY`
- `success_effect`: мягкая развязка, семья сохраняет лицо
- `fail_effect`: меньше общественной выгоды, но кейс закрыт
- `next_node`: `scene_banker_exit_to_map`

## State Delta

- `banker_resolution_style = 'private_settlement'`
- `banker_family_trust = +1`
- `reputation_city = reputation_city + 0`

## Next

[[40_GameViewer/Sandbox_KA/03_Map_Return/scene_banker_exit_to_map|scene_banker_exit_to_map]]
