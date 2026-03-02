---
id: scene_dog_exit_to_map
type: vn_scene
phase: sandbox_dog
tags:
  - type/connector
  - direction/exit
---

# Exit Wrapper: Dog -> Map

## Trigger Source

- Runtime terminal node in `sandbox_dog_park`: `dog_resolved`.

## Preconditions

- `DOG_FOUND = true`
- `DOG_RETURNED = true`
- `DOG_CASE_DONE = true`

## Designer View

- Resolution tone: civic relief, light comedic payoff, restored routine.

## Mechanics View

- Optional evidence branch `collar_clue` remains non-blocking.
- Return is immediate and always available after resolution.

## State Delta

- `DOG_RETURNED = true`
- `DOG_CASE_DONE = true`
- quest stage: `sandbox_dog -> resolved`

## Transitions

- [[40_GameViewer/Sandbox_KA/00_Global/map_karlsruhe_main|map_karlsruhe_main]]

## Validation

- No hard fail at final park scene.
- Map availability remains intact after completion.
