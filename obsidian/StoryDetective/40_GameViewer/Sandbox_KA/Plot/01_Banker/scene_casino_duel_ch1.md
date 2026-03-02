---
id: scene_casino_duel_ch1
type: vn_choice
parent: scene_casino_duel
choice_id: CASINO_EXPOSE_PUBLIC
tags:
  - type/vn_choice
  - case/sandbox_banker
---

# Choice: Публично вскрыть подлог

## Choice Contract v1

- `choice_id`: `CASINO_EXPOSE_PUBLIC`
- `gating_check`: `clue_CLUE_B06_LEDGER_MISMATCH = true`
- `success_effect`: рост репутации, жесткая развязка между отцом и сыном
- `fail_effect`: если улик мало, обвинение звучит как давление
- `next_node`: `scene_banker_exit_to_map`

## State Delta

- `banker_resolution_style = 'public_exposure'`
- `reputation_city = reputation_city + 1`
- `banker_family_trust = -1`

## Next

[[40_GameViewer/Sandbox_KA/03_Map_Return/scene_banker_exit_to_map|scene_banker_exit_to_map]]
