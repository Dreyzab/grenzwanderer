---
id: world_loc_freiburg_archive
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_freiburg_archive
---

# New Town Hall and City Archive

> **ID**: `loc_freiburg_archive`
> **District**: Altstadt (Rathausplatz)
> **Runtime Type**: `BUREAU`
> **Vibe**: _Paper bureaucracy with weaponized memory_

## Atmosphere (Sensory)

- **Sight**: Long corridors, shelves of deed books, sealed cabinets.
- **Sound**: Stamp presses, page rustle, clock tick.
- **Smell**: Dry paper, ink, floor wax.
- **Light**: Narrow windows and desk lamps.
- **Mood**: Slow procedural tension.

## Phase Variations

| Phase   | Description                                                  | Available NPCs                   | Restrictions                                   |
| ------- | ------------------------------------------------------------ | -------------------------------- | ---------------------------------------------- |
| morning | Archive counters open; permit checks are strict.             | librarian, archive_keeper, clerk | After-hours access requires special authority. |
| day     | Peak filing activity enables social stealth.                 | librarian, archive_keeper, clerk | After-hours access requires special authority. |
| evening | Records room partially closed; supervisor approval required. | librarian, archive_keeper, clerk | After-hours access requires special authority. |
| night   | Administrative wing is closed.                               | librarian, archive_keeper, clerk | After-hours access requires special authority. |

## Historical Context (Freiburg 1905)

Municipal reforms around 1901 consolidated records in the New Town Hall, making archives central to property, debt, and identity disputes.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_freiburg_archive`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: archive_enter

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
