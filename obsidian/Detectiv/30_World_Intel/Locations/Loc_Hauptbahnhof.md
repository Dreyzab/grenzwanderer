---
id: world_loc_hbf
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_hbf
---

# Freiburg Hauptbahnhof

> **ID**: `loc_hbf`
> **District**: Rail Hub
> **Runtime Type**: `INTEREST`
> **Vibe**: _Industrial circulation and transient anonymity_

## Atmosphere (Sensory)

- **Sight**: Steam plumes, iron beams, clock face.
- **Sound**: Whistles, carriage brakes, porters calling routes.
- **Smell**: Coal smoke, oil, wet wool.
- **Light**: Harsh daylight through glass roof, dim platforms at dusk.
- **Mood**: Urgent movement.

## Phase Variations

| Phase   | Description                                                 | Available NPCs                 | Restrictions                       |
| ------- | ----------------------------------------------------------- | ------------------------------ | ---------------------------------- |
| morning | Commuter wave and freight manifests surface leads.          | stationmaster, gendarm, worker | Late hours reduce safe interviews. |
| day     | Administrative desks and schedule records are accessible.   | stationmaster, gendarm, worker | Late hours reduce safe interviews. |
| evening | Long-distance departures create surveillance opportunities. | stationmaster, gendarm, worker | Late hours reduce safe interviews. |
| night   | Patrol presence increases; fewer witnesses remain.          | stationmaster, gendarm, worker | Late hours reduce safe interviews. |

## Historical Context (Freiburg 1905)

By 1905, rail expansion linked Freiburg tightly to Basel and Strasbourg, making the station a strategic intelligence and smuggling corridor.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_hbf`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: vn_intro_arrival

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
