---
id: world_loc_pub
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_pub
---

# Gasthaus Zum Schlappen

> **ID**: `loc_pub`
> **District**: Schneckenvorstadt
> **Runtime Type**: `NPC`
> **Vibe**: _Noise, rumor, and transactional trust_

## Atmosphere (Sensory)

- **Sight**: Long tables, crowded mugs, nicotine stains.
- **Sound**: Songs, arguments, ceramic impacts.
- **Smell**: Beer, roast pork, wet coats.
- **Light**: Low lamps and hearth glow.
- **Mood**: Volatile camaraderie.

## Phase Variations

| Phase   | Description                                       | Available NPCs                  | Restrictions                             |
| ------- | ------------------------------------------------- | ------------------------------- | ---------------------------------------- |
| morning | Cleaning shift and staff-only logistics.          | innkeeper, gendarm, dock_worker | Lead unlock required before first entry. |
| day     | Steady local traffic and low-stakes gossip.       | innkeeper, gendarm, dock_worker | Lead unlock required before first entry. |
| evening | Peak rumor economy and faction signaling.         | innkeeper, gendarm, dock_worker | Lead unlock required before first entry. |
| night   | High conflict risk, stronger intimidation checks. | innkeeper, gendarm, dock_worker | Lead unlock required before first entry. |

## Historical Context (Freiburg 1905)

Student-worker taverns near city gates functioned as rumor markets where police, labor, and smugglers overlapped.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_pub`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: pub_enter, pub_trade

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
