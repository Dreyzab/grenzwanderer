---
id: world_loc_uni_chem
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_uni_chem
---

# Kiliani Laboratory

> **ID**: `loc_uni_chem`
> **District**: University Quarter
> **Runtime Type**: `BUREAU`
> **Vibe**: _Controlled experiment and chemical risk_

## Atmosphere (Sensory)

- **Sight**: Glassware arrays, burners, reagent labels.
- **Sound**: Glass clinks, gas hiss, notebook scratching.
- **Smell**: Ether, sulfur, bitter almond trace.
- **Light**: Bright bench lamps and high windows.
- **Mood**: Exacting and volatile.

## Phase Variations

| Phase   | Description                                  | Available NPCs               | Restrictions                             |
| ------- | -------------------------------------------- | ---------------------------- | ---------------------------------------- |
| morning | Assistants prepare reagents and sample logs. | professor, academic, student | Requires residue flag for analysis flow. |
| day     | Formal analysis requests are accepted.       | professor, academic, student | Requires residue flag for analysis flow. |
| evening | Only approved staff remain in wet lab.       | professor, academic, student | Requires residue flag for analysis flow. |
| night   | Lab shutters and chemical vaults are locked. | professor, academic, student | Requires residue flag for analysis flow. |

## Historical Context (Freiburg 1905)

University chemistry labs in 1905 were central to new forensic methods and industrial chemistry, including sugars, solvents, and explosive residues.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_uni_chem`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: chem_analyze

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
