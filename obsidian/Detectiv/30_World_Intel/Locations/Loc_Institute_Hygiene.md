---
id: world_loc_uni_med
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_uni_med
---

# Institute of Hygiene

> **ID**: `loc_uni_med`
> **District**: University Quarter
> **Runtime Type**: `BUREAU`
> **Vibe**: _Clinical rigor over human comfort_

## Atmosphere (Sensory)

- **Sight**: Tile walls, autopsy tables, labeled specimens.
- **Sound**: Metal instrument clatter, running water.
- **Smell**: Formaldehyde, carbolic soap.
- **Light**: Cold electric fixtures.
- **Mood**: Forensic detachment.

## Phase Variations

| Phase   | Description                                      | Available NPCs                  | Restrictions                         |
| ------- | ------------------------------------------------ | ------------------------------- | ------------------------------------ |
| morning | Reports are issued and intake begins.            | coroner, medical staff, student | Blood analysis requires sample flag. |
| day     | Sample analysis and witness handling are active. | coroner, medical staff, student | Blood analysis requires sample flag. |
| evening | Morgue intake only, limited consultation.        | coroner, medical staff, student | Blood analysis requires sample flag. |
| night   | Restricted emergency access only.                | coroner, medical staff, student | Blood analysis requires sample flag. |

## Historical Context (Freiburg 1905)

Serology breakthroughs around 1905 made blood differentiation a practical forensic tool, raising evidentiary standards in urban cases.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_uni_med`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: blood_analyze

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
