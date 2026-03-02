---
id: hub_bank
type: map_hub
location: loc_ka_bank
tags:
  - type/hub
  - function/quest_giver
  - case/sandbox_banker
---

# Hub: Bank (Banker Case)

## Trigger Source

- Entered from [[40_GameViewer/Sandbox_KA/00_Global/map_karlsruhe_main|map_karlsruhe_main]].

## Preconditions

- `ka_intro_complete = true`
- `BANKER_CASE_DONE = false`

## Designer View

- First client hub for the banker contract.
- Tone: private scandal, reputation pressure, urgency.

## Available Quests

- `sandbox_banker` (The Banker's Son)

## Available Interactions

- Meet client `Herr Richter`
- Review lead status: son house, tavern, casino

## Requirements

- Initial talk requires no extra flags.
- Casino stage requires `TAVERN_GOSSIP = true` (runtime point condition).

## Purpose

- Establishes the case and opens investigation branches.

## Mechanics View

- Runtime entry binding: `start_vn('sandbox_banker_client')`.
- Subsequent chain is point-driven:
  - `loc_ka_son_house -> sandbox_banker_son_house`
  - `loc_ka_tavern -> sandbox_banker_tavern`
  - `loc_ka_casino -> sandbox_banker_casino`

## State Delta

- Hub open itself does not mutate state.
- Case state mutation begins inside `scene_banker_entry` / `sandbox_banker_client`.

## Transitions

- [[40_GameViewer/Sandbox_KA/02_Quest_Entries/scene_banker_entry|scene_banker_entry]]
- [[40_GameViewer/Sandbox_KA/00_Global/map_karlsruhe_main|map_karlsruhe_main]]

## Validation

- Hub remains available until `BANKER_CASE_DONE = true`.
- No critical-path hard fail before map return.
