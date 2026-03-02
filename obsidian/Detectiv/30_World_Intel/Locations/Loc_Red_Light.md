---
id: world_loc_red_light
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_red_light
---

# Gerberau Canal

> **ID**: `loc_red_light`
> **District**: Canal Quarter
> **Runtime Type**: `INTEREST`
> **Vibe**: _Shadow market and social camouflage_

## Atmosphere (Sensory)

- **Sight**: Narrow bridges, workshop runoff, alley lamps.
- **Sound**: Water drip, muffled deals, distant music.
- **Smell**: Wet leather, tannin, sewage edge.
- **Light**: Reflected gaslight on dark water.
- **Mood**: Predatory secrecy.

## Phase Variations

| Phase   | Description                                  | Available NPCs                   | Restrictions                               |
| ------- | -------------------------------------------- | -------------------------------- | ------------------------------------------ |
| morning | Craft labor dominates, low covert traffic.   | fortune_teller, smuggler, dancer | Safety risk rises at night without allies. |
| day     | Informal traders blend into market flow.     | fortune_teller, smuggler, dancer | Safety risk rises at night without allies. |
| evening | Rumor and vice circuits accelerate.          | fortune_teller, smuggler, dancer | Safety risk rises at night without allies. |
| night   | High-risk intel but strong payoff potential. | fortune_teller, smuggler, dancer | Safety risk rises at night without allies. |

## Historical Context (Freiburg 1905)

Tanner and canal districts around 1905 combined legitimate craft labor with off-ledger exchange after dark.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_red_light`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: none

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
