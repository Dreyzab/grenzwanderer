---
id: world_loc_student_house
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_student_house
---

# Corps Suevia House

> **ID**: `loc_student_house`
> **District**: University Quarter
> **Runtime Type**: `INTEREST`
> **Vibe**: _Privilege, debt, and coded rivalry_

## Atmosphere (Sensory)

- **Sight**: Colored caps, duel scars, heraldic decor.
- **Sound**: Choral chants, table knocks.
- **Smell**: Polish, tobacco, spilled beer.
- **Light**: Bright common hall, dim side rooms.
- **Mood**: Provocative status theater.

## Phase Variations

| Phase   | Description                                | Available NPCs                 | Restrictions                     |
| ------- | ------------------------------------------ | ------------------------------ | -------------------------------- |
| morning | Quiet recovery and servant traffic.        | student, student_leader, noble | Unlocked after lead progression. |
| day     | Formal calls and correspondence.           | student, student_leader, noble | Unlocked after lead progression. |
| evening | Duel tales and gambling circles expand.    | student, student_leader, noble | Unlocked after lead progression. |
| night   | Closed rank behavior; outsiders pressured. | student, student_leader, noble | Unlocked after lead progression. |

## Historical Context (Freiburg 1905)

Corps houses in 1905 were power incubators for elite networks, often tied to dueling culture and patronage.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_student_house`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: corps_visit

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
