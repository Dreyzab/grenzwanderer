---
id: world_loc_telephone
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_telephone
---

# Telegraph Office

> **ID**: `loc_telephone`
> **District**: Altstadt Administrative Strip
> **Runtime Type**: `BUREAU`
> **Vibe**: _Urgent messages under institutional control_

## Atmosphere (Sensory)

- **Sight**: Switchboard racks, coded forms, waiting bench.
- **Sound**: Relay clicks and line buzz.
- **Smell**: Hot wire insulation, paper dust.
- **Light**: Task lamps over switchboard.
- **Mood**: Compressed urgency.

## Phase Variations

| Phase   | Description                                             | Available NPCs              | Restrictions                   |
| ------- | ------------------------------------------------------- | --------------------------- | ------------------------------ |
| morning | Official dispatch cycle and bureaucratic queue.         | operator, clerk, journalist | Hidden until interlude unlock. |
| day     | Public telegram traffic and interception opportunities. | operator, clerk, journalist | Hidden until interlude unlock. |
| evening | Priority lines remain; staff reduced.                   | operator, clerk, journalist | Hidden until interlude unlock. |
| night   | Emergency-only communications.                          | operator, clerk, journalist | Hidden until interlude unlock. |

## Historical Context (Freiburg 1905)

Telegraph nodes in 1905 compressed political and commercial response times, turning information routing into strategic power.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_telephone`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: trigger_interlude_b

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
