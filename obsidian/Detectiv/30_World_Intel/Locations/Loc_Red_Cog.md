---
id: world_loc_workers_pub
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_workers_pub
---

# Tavern The Red Cog

> **ID**: `loc_workers_pub`
> **District**: Stuehlinger
> **Runtime Type**: `SUPPORT`
> **Vibe**: _Labor politics and underground brokerage_

## Atmosphere (Sensory)

- **Sight**: Posters, smoke haze, scarred tables.
- **Sound**: Debates, train rattle, stein knocks.
- **Smell**: Coal dust, stale beer, cabbage stew.
- **Light**: Oil lamps and backroom shadows.
- **Mood**: Defiant and suspicious.

## Phase Variations

| Phase   | Description                                  | Available NPCs                | Restrictions                              |
| ------- | -------------------------------------------- | ----------------------------- | ----------------------------------------- |
| morning | Delivery crews and newspaper bundles.        | socialist, pawnbroker, worker | Fence access requires flag or reputation. |
| day     | Union chatter and recruitment channels.      | socialist, pawnbroker, worker | Fence access requires flag or reputation. |
| evening | Fence operations and high-value rumor trade. | socialist, pawnbroker, worker | Fence access requires flag or reputation. |
| night   | Police visibility increases around exits.    | socialist, pawnbroker, worker | Fence access requires flag or reputation. |

## Historical Context (Freiburg 1905)

Worker taverns around industrial rails were hubs for union messaging and covert exchange beyond elite oversight.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_workers_pub`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: quest_victoria_entry, socialist_talk, workers_fence_trade

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
