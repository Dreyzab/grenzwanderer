---
id: scenario_board
tags:
  - type/moc
  - domain/narrative
  - status/stable
aliases:
  - Scenario Board
---

# Scenario Board

## Purpose

Main control board for writing flow and scene decisions.

## Graph boards

- [[MOC_Scenarios]]
- [[MOC_Timeline]]
- [[MOC_Event_Graph]]
- [[Gameplay_Story_Board]]

## Active

- [[scn_01_briefing]]
- [[scn_01_bank_scene]]

## Next

- [[scn_01_archive]]
- [[scn_01_warehouse]]

## Parking

- Ideas not in current sprint.

## Rules

- One scene note = one scene.
- Each scene must link to one `time_*`, one `loc_*`, at least one `evt_*`, at least one `char_*`.
- Scene progression should target stable `loc_*` first, then specific `map_point` actions.
- Each scenario must declare entry scene and next branch.
- Mark location visibility state (`unknown/visible/explored/resolved`) when scene changes map knowledge.
- Validate with [[99_System/Narrative_Consistency_Checklist|Narrative Consistency Checklist]] before coding.
- For flow-node chains, also validate with [[99_System/Narrative_Gameplay_Checklist|Narrative Gameplay Checklist]].
