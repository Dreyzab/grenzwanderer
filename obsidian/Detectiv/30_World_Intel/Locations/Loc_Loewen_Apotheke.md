---
id: world_loc_apothecary
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_apothecary
---

# Loewen-Apotheke

> **ID**: `loc_apothecary`
> **District**: Altstadt
> **Runtime Type**: `NPC`
> **Vibe**: _Medicinal order with contraband undertones_

## Atmosphere (Sensory)

- **Sight**: Porcelain jars, scales, herb bundles.
- **Sound**: Mortar grinding, bell chime.
- **Smell**: Camphor, mint, ether trace.
- **Light**: Warm counters, dim rear shelves.
- **Mood**: Professional but guarded.

## Phase Variations

| Phase   | Description                                     | Available NPCs               | Restrictions                             |
| ------- | ----------------------------------------------- | ---------------------------- | ---------------------------------------- |
| morning | Prescription traffic and routine consultations. | apothecary, student, cleaner | Lead unlock required before first entry. |
| day     | Trade menu fully available.                     | apothecary, student, cleaner | Lead unlock required before first entry. |
| evening | Selective clients and rumor exchange.           | apothecary, student, cleaner | Lead unlock required before first entry. |
| night   | Closed front door, emergency knock only.        | apothecary, student, cleaner | Lead unlock required before first entry. |

## Historical Context (Freiburg 1905)

Urban pharmacies in 1905 bridged regulated medicine and informal networks for ether, alcohol, and restricted compounds.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_apothecary`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: apothecary_enter, apothecary_trade

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
