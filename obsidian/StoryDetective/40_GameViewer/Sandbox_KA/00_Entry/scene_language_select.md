---
id: scene_language_select
type: vn_scene
phase: sandbox_intro
status: active
tags:
  - type/vn_scene
  - layer/entry
  - case/sandbox_ka
---

# Entry: scene_language_select

## Trigger Source

- Entered from [[40_GameViewer/Sandbox_KA/00_Entry/scene_start|scene_start]].

## Preconditions

- Start scene completed.

## Designer View

- Player chooses interface language and readability settings.

## Mechanics View

- Configuration stage (DE/EN/RU) before narrative commitment.

## State Delta

- Language/UI config values stored for current profile.

## Transitions

- [[40_GameViewer/Sandbox_KA/00_Entry/scene_backstory_select|scene_backstory_select]]

## Validation

- Scene cannot block progression after language selection.
