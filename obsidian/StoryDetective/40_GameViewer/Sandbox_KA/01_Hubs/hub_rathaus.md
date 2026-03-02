---
id: hub_rathaus
type: map_hub
location: loc_ka_rathaus
tags:
  - type/hub
  - function/quest_giver
  - case/sandbox_dog
---

# Hub: Rathaus (Dog Case)

## Trigger Source

- Entered from [[40_GameViewer/Sandbox_KA/00_Global/map_karlsruhe_main|map_karlsruhe_main]].

## Preconditions

- `ka_intro_complete = true`
- `DOG_CASE_DONE = false`

## Designer View

- Civic hub with comedic urgency and public pressure.

## Available Quests

- `sandbox_dog` (The Mayor's Dog)

## Available Interactions

- Meet mayor and accept contract
- Track breadcrumb progression (butcher -> bakery -> park)

## Requirements

- Initial talk: no additional gating.
- Butcher requires `TALKED_MAYOR = true`.
- Bakery requires `DOG_BUTCHER_CLUE = true`.
- Park requires `DOG_BAKERY_CLUE = true`.

## Purpose

- Provides the clearest breadcrumb case in sandbox.

## Mechanics View

- Runtime entry binding: `start_vn('sandbox_dog_mayor')`.
- Lead nodes run as separate VN scenarios from map points.

## State Delta

- Hub open itself does not mutate state.
- Case state is updated in `scene_dog_entry` / runtime Dog scenarios.

## Transitions

- [[40_GameViewer/Sandbox_KA/02_Quest_Entries/scene_dog_entry|scene_dog_entry]]
- [[40_GameViewer/Sandbox_KA/00_Global/map_karlsruhe_main|map_karlsruhe_main]]

## Validation

- Hub remains active until `DOG_CASE_DONE = true`.
- Soft-fail checks in leads must still allow eventual completion.
