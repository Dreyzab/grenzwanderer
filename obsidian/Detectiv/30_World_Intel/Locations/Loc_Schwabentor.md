---
id: world_loc_schwabentor
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_schwabentor
---

# Schwabentor

> **ID**: `loc_schwabentor`
> **District**: Wiehre Edge
> **Runtime Type**: `INTEREST`
> **Vibe**: _Peripheral gate with smuggling potential_

## Atmosphere (Sensory)

- **Sight**: Gate tower, narrow lane bottlenecks.
- **Sound**: Foot carts, hoofbeats, distant bells.
- **Smell**: Wet stone and horse leather.
- **Light**: Long shadow corridor near sunset.
- **Mood**: Uneasy transit.

## Phase Variations

| Phase   | Description                                        | Available NPCs          | Restrictions                       |
| ------- | -------------------------------------------------- | ----------------------- | ---------------------------------- |
| morning | Merchants pass with light supervision.             | student, noble, unknown | Stealth checks favored after dark. |
| day     | Street performers and traffic noise provide cover. | student, noble, unknown | Stealth checks favored after dark. |
| evening | Smuggling routes begin to activate.                | student, noble, unknown | Stealth checks favored after dark. |
| night   | Minimal civilian presence and high risk.           | student, noble, unknown | Stealth checks favored after dark. |

## Historical Context (Freiburg 1905)

The eastern gate zone connected urban trade to hillside routes, useful for discrete movement around official checkpoints.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_schwabentor`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: none

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
