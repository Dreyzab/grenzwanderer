---
id: scene_ghost_exit_to_map
type: vn_scene
phase: sandbox_ghost
tags:
  - type/connector
  - direction/exit
---

# Exit Wrapper: Ghost -> Map

## Trigger Source

- Runtime terminal node in `sandbox_ghost_conclude`: `conclusion_outro`.

## Preconditions

- `GHOST_ACCUSED = true`
- `GHOST_CASE_DONE = true`

## Designer View

- Final accusation closes estate arc with one of two supported lines:
  - supernatural
  - contraband

## Mechanics View

- If no fair pair is available, weak accusation branch allows withdrawal back to map.
- Strong verdict branches set final resolution flags and move quest to resolved.

## State Delta

- `GHOST_CASE_DONE = true`
- one resolution flag:
  - `GHOST_RESOLUTION_SUPERNATURAL`
  - or `GHOST_RESOLUTION_CONTRABAND`
- quest stage: `sandbox_ghost -> resolved`

## Transitions

- [[40_GameViewer/Sandbox_KA/00_Global/map_karlsruhe_main|map_karlsruhe_main]]

## Validation

- No dead-end after failed/weak accusation path.
- All finalized verdicts must expose map return action.
