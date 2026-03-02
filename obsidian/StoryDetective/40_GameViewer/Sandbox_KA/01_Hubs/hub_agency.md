---
id: hub_agency
type: map_hub
location: loc_ka_agency
tags:
  - type/hub
  - function/home
  - case/sandbox_ka
---

# Hub: Agency (Home)

## Trigger Source

- Entered from [[40_GameViewer/Sandbox_KA/00_Global/map_karlsruhe_main|map_karlsruhe_main]].

## Preconditions

- `ka_intro_complete = true`

## Designer View

- Home base for orientation and optional support interactions.

## Available Quests

- Optional follow-up: guildmaster check-in (non-critical).

## Available Interactions

- Rest and review
- Dossier maintenance
- Optional guidance meeting

## Requirements

- Guildmaster follow-up is optional and should stay non-blocking.

## Purpose

- Provides downtime anchor without interrupting sandbox pacing.

## Mechanics View

- Always available after intro.
- Must not gate core case progression.

## State Delta

- No mandatory state mutation on hub enter.

## Transitions

- [[40_GameViewer/Sandbox_KA/01_Hubs/scene_agency_guildmaster|scene_agency_guildmaster]]
- [[40_GameViewer/Sandbox_KA/00_Global/map_karlsruhe_main|map_karlsruhe_main]]

## Validation

- Return-to-map action is always available.
- Optional interaction cannot lock or redirect critical-path flow.
