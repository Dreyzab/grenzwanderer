---
id: world_loc_freiburg_bank
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_freiburg_bank
---

# Bankhaus J.A. Krebs

> **ID**: `loc_freiburg_bank`
> **District**: Altstadt (Muensterplatz)
> **Runtime Type**: `CRIME_SCENE`
> **Vibe**: _Institutional prestige under forensic pressure_

## Atmosphere (Sensory)

- **Sight**: Baroque facade, fresh renovation scaffolds, polished counters.
- **Sound**: Muted clerk chatter, stamp hits, vault metal resonance.
- **Smell**: Ink, brass polish, cold stone.
- **Light**: Filtered daylight through high windows and gas lamps.
- **Mood**: Controlled panic.

## Phase Variations

| Phase   | Description                                               | Available NPCs                 | Restrictions                      |
| ------- | --------------------------------------------------------- | ------------------------------ | --------------------------------- |
| morning | Bank opens with routine counting and guard rotation.      | bank_manager, clerk, inspector | Night entry is gated by approach. |
| day     | Peak transactions, witnesses and clerks available.        | bank_manager, clerk, inspector | Night entry is gated by approach. |
| evening | Public floor closes; only staff and investigators remain. | bank_manager, clerk, inspector | Night entry is gated by approach. |
| night   | Closed; access requires lockpick, warrant, or bribe.      | bank_manager, clerk, inspector | Night entry is gated by approach. |

## Historical Context (Freiburg 1905)

Private banking houses around Muensterplatz represented conservative financial power in Freiburg circa 1905, while modernization projects exposed elite corruption risks.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_freiburg_bank`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: bank_enter, bank_qr

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
