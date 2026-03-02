---
id: world_loc_freiburg_warehouse
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_freiburg_warehouse
---

# Old Railway Warehouse

> **ID**: `loc_freiburg_warehouse`
> **District**: Stuehlinger Freight Zone
> **Runtime Type**: `CRIME_SCENE`
> **Vibe**: _Industrial silence before violent resolution_

## Atmosphere (Sensory)

- **Sight**: Crates, coal residue, rail spurs.
- **Sound**: Loose metal clang, distant engines.
- **Smell**: Coal, rope fiber, damp timber.
- **Light**: High windows with deep shadow pockets.
- **Mood**: Impending confrontation.

## Phase Variations

| Phase   | Description                                          | Available NPCs                         | Restrictions                              |
| ------- | ---------------------------------------------------- | -------------------------------------- | ----------------------------------------- |
| morning | Logistics staff and manifest activity.               | warehouse_guard, enforcer, dock_worker | Hidden until investigation chain unlocks. |
| day     | Freight movement masks suspicious transfers.         | warehouse_guard, enforcer, dock_worker | Hidden until investigation chain unlocks. |
| evening | Restricted access and guard tightening.              | warehouse_guard, enforcer, dock_worker | Hidden until investigation chain unlocks. |
| night   | Critical finale window with high confrontation risk. | warehouse_guard, enforcer, dock_worker | Hidden until investigation chain unlocks. |

## Historical Context (Freiburg 1905)

Freight depots in 1905 were ideal for contraband staging due to rail throughput and fragmented oversight.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_freiburg_warehouse`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: raid_start

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
