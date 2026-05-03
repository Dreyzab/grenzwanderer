---
id: world_loc_pub_deutsche
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_pub_deutsche
---

# Zum Goldenen Adler

> **ID**: `loc_pub_deutsche`
> **District**: Schneckenvorstadt
> **Runtime Type**: `SUPPORT`
> **Vibe**: _Reserved lodging, dense tavern chatter, and class friction_

## Atmosphere (Sensory)

- **Sight**: Crowded benches, travel trunks, room keys, cheap posters.
- **Sound**: Accent-rich chatter and table percussion.
- **Smell**: Beer foam, smoke, soup stock.
- **Light**: Yellow lamps and kitchen spill light.
- **Mood**: Crowded opportunism.

## Phase Variations

| Phase   | Description                                         | Available NPCs               | Restrictions                             |
| ------- | --------------------------------------------------- | ---------------------------- | ---------------------------------------- |
| morning | Travelers check out; staff hears overnight stories. | innkeeper, socialist, worker | No hard lock; social checks harder late. |
| day     | Steady meal service and low-intensity intel.        | innkeeper, socialist, worker | No hard lock; social checks harder late. |
| evening | Rumor market peaks with alcohol flow.               | innkeeper, socialist, worker | No hard lock; social checks harder late. |
| night   | Noise and conflict obscure careful questioning.     | innkeeper, socialist, worker | No hard lock; social checks harder late. |

## Historical Context (Freiburg 1905)

Cross-district inns near rail arteries mixed travelers and locals, making them natural rumor exchangers.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_pub_deutsche`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: `case01_lodging_zum_goldenen_adler`

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
