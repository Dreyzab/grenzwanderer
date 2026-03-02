---
id: hub_estate
type: map_hub
location: loc_ka_estate
tags:
  - type/hub
  - function/quest_giver
  - case/sandbox_ghost
---

# Hub: Estate (Ghost Case)

## Trigger Source

- Entered from [[40_GameViewer/Sandbox_KA/00_Global/map_karlsruhe_main|map_karlsruhe_main]].

## Preconditions

- `ka_intro_complete = true`
- `GHOST_CASE_DONE = false`

## Designer View

- Mystery hub with clue collection and deduction resolution.

## Available Quests

- `sandbox_ghost` (The Haunted Estate)

## Available Interactions

- Estate investigation
- Guild consultation
- Final accusation in estate

## Requirements

- Investigation entry: `GHOST_CLIENT_MET = true` and `ESTATE_INVESTIGATED = false`
- Guild unlock requires `ESTATE_INVESTIGATED = true`
- Final accusation requires `ESTATE_INVESTIGATED = true` and `GUILD_VISITED = true`

## Purpose

- Teaches fair-clue reasoning with two valid resolution lines.

## Mechanics View

- Runtime entry binding: `start_vn('sandbox_ghost_investigate')`.
- Mid node: `start_vn('sandbox_ghost_guild')` via `loc_ka_guild`.
- Conclusion node: `start_vn('sandbox_ghost_conclude')`.

## State Delta

- Hub open itself does not mutate state.
- Case mutation happens in Ghost scenarios.

## Transitions

- [[40_GameViewer/Sandbox_KA/02_Quest_Entries/scene_ghost_entry|scene_ghost_entry]]
- [[40_GameViewer/Sandbox_KA/00_Global/map_karlsruhe_main|map_karlsruhe_main]]

## Validation

- Both supernatural and contraband lines must remain reachable when evidence pairs are satisfied.
- No dead-end after weak accusation path (must allow withdrawal to map).
