---
id: world_loc_street_event
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_street_event
---

# Street Encounter Node

> **ID**: `loc_street_event`
> **District**: Altstadt Connector
> **Runtime Type**: `INTEREST`
> **Vibe**: _Sudden narrative interruption in public space_

## Atmosphere (Sensory)

- **Sight**: Crowd knot around a focal disturbance.
- **Sound**: Shouts, hoofbeats, police whistle.
- **Smell**: Street dust and hot metal.
- **Light**: Open daylight shifting into lantern glow.
- **Mood**: Instability and opportunity.

## Phase Variations

| Phase   | Description                                       | Available NPCs                 | Restrictions                   |
| ------- | ------------------------------------------------- | ------------------------------ | ------------------------------ |
| morning | Routine patrol can defuse incidents quickly.      | assistant, journalist, unknown | Hidden until interlude unlock. |
| day     | Maximum witnesses and branching social outcomes.  | assistant, journalist, unknown | Hidden until interlude unlock. |
| evening | Ambiguity increases, identities harder to verify. | assistant, journalist, unknown | Hidden until interlude unlock. |
| night   | Limited visibility and elevated deception risk.   | assistant, journalist, unknown | Hidden until interlude unlock. |

## Historical Context (Freiburg 1905)

Street demonstrations and chance encounters were routine in rapidly modernizing cities where class and politics collided.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_street_event`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: trigger_interlude_a

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]
