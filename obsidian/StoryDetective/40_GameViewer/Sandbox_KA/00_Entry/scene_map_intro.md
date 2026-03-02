---
id: scene_map_intro
type: vn_scene
phase: sandbox_intro
status: active
tags:
  - type/vn_scene
  - layer/entry
  - case/sandbox_ka
---

# Entry: scene_map_intro

## Trigger Source

- Entered from [[40_GameViewer/Sandbox_KA/00_Entry/scene_backstory_select|scene_backstory_select]].

## Preconditions

- Entry chain is complete.

## Designer View

- Introduces free-order sandbox structure and map-centric play.

## Mechanics View

- Runtime intro scenario sets:
  - `ka_sandbox_started = true`
  - `ka_intro_complete = true`
- Unlocks starting client hubs:
  - `loc_ka_bank`
  - `loc_ka_rathaus`
  - `loc_ka_estate`

## State Delta

- Quest stage update: `sandbox_karlsruhe -> exploring`.

## Transitions

- [[40_GameViewer/Sandbox_KA/00_Global/map_karlsruhe_main|map_karlsruhe_main]]

## Validation

- After this scene, player should always have at least one available client hub.
