---
id: world_loc_tailor
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_tailor
---

# Schneider Workshop

> **ID**: `loc_tailor`
> **District**: Altstadt
> **Runtime Type**: `NPC`
> **Vibe**: _Craft precision masking social surveillance_

## Atmosphere (Sensory)

- **Sight**: Fabric bolts, mannequins, mirror line.
- **Sound**: Scissors, foot pedal machine, steam iron.
- **Smell**: Wool, starch, cigar residue.
- **Light**: Gaslight over fitting mirrors.
- **Mood**: Intimate negotiation.

## Phase Variations

| Phase   | Description                                            | Available NPCs            | Restrictions                             |
| ------- | ------------------------------------------------------ | ------------------------- | ---------------------------------------- |
| morning | Appointments and order books open.                     | tailor, noble, journalist | Lead unlock required before first entry. |
| day     | Measurements and fittings expose social links.         | tailor, noble, journalist | Lead unlock required before first entry. |
| evening | Private consultations and covert commissions.          | tailor, noble, journalist | Lead unlock required before first entry. |
| night   | Workshop shutters closed; backroom only by invitation. | tailor, noble, journalist | Lead unlock required before first entry. |

## Historical Context (Freiburg 1905)

Tailor workshops near theater circuits often doubled as information hubs, where clothing orders revealed status, debt, and secret travel.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_tailor`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: tailor_enter, tailor_trade

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
