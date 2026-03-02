---
id: world_loc_martinstor
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_martinstor
---

# Martinstor

> **ID**: `loc_martinstor`
> **District**: City Gate Axis
> **Runtime Type**: `INTEREST`
> **Vibe**: _Historic gate under electric modernity_

## Atmosphere (Sensory)

- **Sight**: Stone arch, tram wires, clock tower.
- **Sound**: Tram bell and wheel screech.
- **Smell**: Ozone, stone dust.
- **Light**: Open daylight and electric sparks at dusk.
- **Mood**: Threshold tension.

## Phase Variations

| Phase   | Description                                     | Available NPCs            | Restrictions                                      |
| ------- | ----------------------------------------------- | ------------------------- | ------------------------------------------------- |
| morning | Commute crowd supports observation checks.      | gendarm, student, cleaner | No hard lock, but lower witness density at night. |
| day     | Transit flow masks surveillance.                | gendarm, student, cleaner | No hard lock, but lower witness density at night. |
| evening | Reduced visibility increases pickpocket risk.   | gendarm, student, cleaner | No hard lock, but lower witness density at night. |
| night   | Sparse pedestrian flow, higher patrol salience. | gendarm, student, cleaner | No hard lock, but lower witness density at night. |

## Historical Context (Freiburg 1905)

The gate area symbolized Freiburg modernization when tram infrastructure was threaded through medieval architecture.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_martinstor`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: none

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
