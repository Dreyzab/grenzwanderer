---
id: sandbox_ka_flow
aliases:
  - Karlsruhe Sandbox Flow
tags:
  - type/moc
  - perspective/gameviewer
  - city/karlsruhe
  - pack/ka1905
  - status/wip
---

# Karlsruhe Sandbox Flow

## Runtime Architecture

`scene_start -> scene_language_select -> scene_backstory_select -> scene_map_intro -> map_karlsruhe_main -> hub_* -> scene_*_entry -> Plot/* -> scene_*_exit_to_map -> map_karlsruhe_main`

## Runtime Contracts

- `packId`: `ka1905`
- `caseId`: `sandbox_karlsruhe`
- Partner hint: "Нужно поговорить с 3 заказчиками."
- Critical rule: no hard-stop on critical path without recovery route.

## Entry Layer

- [[40_GameViewer/Sandbox_KA/00_Entry/scene_start|scene_start]]
- [[40_GameViewer/Sandbox_KA/00_Entry/scene_language_select|scene_language_select]]
- [[40_GameViewer/Sandbox_KA/00_Entry/scene_backstory_select|scene_backstory_select]]
- [[40_GameViewer/Sandbox_KA/00_Entry/scene_map_intro|scene_map_intro]]

## Map Layer

- [[40_GameViewer/Sandbox_KA/00_Global/map_karlsruhe_main|map_karlsruhe_main]]
- [[40_GameViewer/Sandbox_KA/00_Global/char_partner|char_partner]]
- `map_karlsruhe_main` is the central hub and return target for all completed branches.

## Hub Layer

- [[40_GameViewer/Sandbox_KA/01_Hubs/hub_bank|hub_bank]]
  -> [[40_GameViewer/Sandbox_KA/02_Quest_Entries/scene_banker_entry|scene_banker_entry]]
  -> runtime `start_vn('sandbox_banker_client')`
- [[40_GameViewer/Sandbox_KA/01_Hubs/hub_rathaus|hub_rathaus]]
  -> [[40_GameViewer/Sandbox_KA/02_Quest_Entries/scene_dog_entry|scene_dog_entry]]
  -> runtime `start_vn('sandbox_dog_mayor')`
- [[40_GameViewer/Sandbox_KA/01_Hubs/hub_estate|hub_estate]]
  -> [[40_GameViewer/Sandbox_KA/02_Quest_Entries/scene_ghost_entry|scene_ghost_entry]]
  -> runtime `start_vn('sandbox_ghost_investigate')`
- [[40_GameViewer/Sandbox_KA/01_Hubs/hub_agency|hub_agency]]
  -> [[40_GameViewer/Sandbox_KA/01_Hubs/scene_agency_guildmaster|scene_agency_guildmaster]] (optional support node)

## Quest Wrapper Layer (Synced)

| Quest  | Runtime Scenarios                                                                                    | Entry Wrapper        | Exit Wrapper               | Completion Flag    |
| ------ | ---------------------------------------------------------------------------------------------------- | -------------------- | -------------------------- | ------------------ |
| Banker | `sandbox_banker_client -> sandbox_banker_son_house / sandbox_banker_tavern -> sandbox_banker_casino` | `scene_banker_entry` | `scene_banker_exit_to_map` | `BANKER_CASE_DONE` |
| Dog    | `sandbox_dog_mayor -> sandbox_dog_butcher -> sandbox_dog_bakery -> sandbox_dog_park`                 | `scene_dog_entry`    | `scene_dog_exit_to_map`    | `DOG_CASE_DONE`    |
| Ghost  | `sandbox_ghost_investigate -> sandbox_ghost_guild -> sandbox_ghost_conclude`                         | `scene_ghost_entry`  | `scene_ghost_exit_to_map`  | `GHOST_CASE_DONE`  |

## Map Point Bindings (Runtime)

- `loc_ka_bank -> start_vn('sandbox_banker_client')`
- `loc_ka_son_house -> start_vn('sandbox_banker_son_house')`
- `loc_ka_tavern -> start_vn('sandbox_banker_tavern')`
- `loc_ka_casino -> start_vn('sandbox_banker_casino')`
- `loc_ka_rathaus -> start_vn('sandbox_dog_mayor')`
- `loc_ka_butcher -> start_vn('sandbox_dog_butcher')`
- `loc_ka_bakery -> start_vn('sandbox_dog_bakery')`
- `loc_ka_park -> start_vn('sandbox_dog_park')`
- `loc_ka_estate -> start_vn('sandbox_ghost_investigate' / 'sandbox_ghost_conclude')`
- `loc_ka_guild -> start_vn('sandbox_ghost_guild')`

## Canvas

- Main board: [[40_GameViewer/Sandbox_KA/Sandbox_KA_Flow.canvas|Sandbox_KA_Flow.canvas]]
- Edge labels use `available`, `locked`, `completed` semantics.

## Notes

- Existing plot chains stay in `Plot/**` as narrative references.
- Runtime source of truth for scene order and flags is `apps/web/src/entities/visual-novel/scenarios/detective/sandbox/**`.
- Exit wrappers represent approved return-to-map states and must stay synchronized with runtime flags.
