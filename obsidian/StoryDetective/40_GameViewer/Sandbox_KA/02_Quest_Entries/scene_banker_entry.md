---
id: scene_banker_entry
type: vn_scene
phase: sandbox_banker
tags:
  - type/connector
  - direction/entry
---

# Entry Wrapper: Banker Case

## Trigger Source

- Entered from [[40_GameViewer/Sandbox_KA/01_Hubs/hub_bank|hub_bank]].
- Runtime map action: `loc_ka_bank -> start_vn('sandbox_banker_client')`.

## Preconditions

- `ka_intro_complete = true`
- `BANKER_CASE_DONE = false`

## Designer View

- First scene framing: private bank office, anxious client, hidden family risk.
- Opening objective: accept contract and open initial leads.

## Mechanics View

- Runtime scenario id: `sandbox_banker_client`.
- Key choice branch in first scene:
  - `accept_case`
  - `press_motive` with skill check (`logic`, diff 10).
- On accept, map unlocks:
  - `loc_ka_son_house`
  - `loc_ka_tavern`

## State Delta

- `TALKED_BANKER = true`
- `BANKER_INVESTIGATION_OPEN = true`
- optional clues from pressure check: `CLUE_B05_WAX_ON_GLOVE`, `CLUE_B06_LEDGER_MISMATCH`
- quest stage: `sandbox_banker -> client_met`

## Transitions

- Runtime: `sandbox_banker_client` -> `sandbox_banker_son_house` / `sandbox_banker_tavern` -> `sandbox_banker_casino`
- Narrative chain reference:
  - [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_intro|scene_bank_intro]]
  - [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_leads|scene_bank_leads]]

## Validation

- Player must always have a valid return-to-map choice.
- Case can progress with or without successful pressure check.
