---
id: scene_ghost_entry
type: vn_scene
phase: sandbox_ghost
tags:
  - type/connector
  - direction/entry
---

# Entry Wrapper: Ghost Case

## Trigger Source

- Entered from [[40_GameViewer/Sandbox_KA/01_Hubs/hub_estate|hub_estate]].
- Runtime map action: `loc_ka_estate -> start_vn('sandbox_ghost_investigate')`.

## Preconditions

- `ka_intro_complete = true`
- `GHOST_CASE_DONE = false`
- initial client flag available: `GHOST_CLIENT_MET = true`

## Designer View

- Mystery setup at estate perimeter.
- Objective: collect enough fair clues, visit guild, then present accusation.

## Mechanics View

- Runtime chain:
  - `sandbox_ghost_investigate` (4 clues, needs >=2 to continue)
  - `sandbox_ghost_guild` (deduction alignment)
  - `sandbox_ghost_conclude` (final accusation)
- Supports two fair resolution lines:
  - supernatural pair
  - contraband pair

## State Delta

- During investigation stages:
  - clue flags `CLUE_GHOST_*`
  - `ESTATE_INVESTIGATED = true`
  - `GHOST_HAS_2_CLUES = true`
  - unlock `loc_ka_guild`
- quest stages: `client_met -> investigating -> evidence_collected -> guild_visit -> accusation -> resolved`

## Transitions

- Narrative chain reference:
  - [[40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_estate_intro|scene_estate_intro]]
  - [[40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_evidence_collection|scene_evidence_collection]]
  - [[40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_guild_tutorial|scene_guild_tutorial]]
  - [[40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_conclusion_true|scene_conclusion_true]]
  - [[40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_conclusion_false|scene_conclusion_false]]

## Validation

- Withdrawal from weak accusation returns to map instead of hard-stop.
- At least one fair evidence pair is required for each strong accusation branch.
