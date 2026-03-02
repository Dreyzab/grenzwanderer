---
id: scene_banker_exit_to_map
type: vn_scene
phase: sandbox_banker
tags:
  - type/connector
  - direction/exit
---

# Exit Wrapper: Banker -> Map

## Trigger Source

- Runtime finalization in `sandbox_banker_casino`:
  - `resolution_public`
  - `resolution_private`
  - terminal node `case_closed`

## Preconditions

- `SON_DUEL_DONE = true`
- `BANKER_CASE_DONE = true`

## Designer View

- Post-duel fallout resolves family scandal with moral style choice:
  - public exposure
  - private settlement

## Mechanics View

- Battle step: `sandbox_son_duel` returns to VN fallout via `resumeSceneId = casino_fallout`.
- Return action: map route for active pack (`/city/ka1905/map`).

## State Delta

- `BANKER_CASE_DONE = true`
- `banker_resolved = true`
- one style flag:
  - `BANKER_RESOLUTION_STYLE_PUBLIC`
  - or `BANKER_RESOLUTION_STYLE_PRIVATE`
- quest stage: `sandbox_banker -> resolved`

## Transitions

- [[40_GameViewer/Sandbox_KA/00_Global/map_karlsruhe_main|map_karlsruhe_main]]

## Validation

- No dead-end after duel outcome (win/lose both return into fallout).
- Case closure always exposes map return choice.
