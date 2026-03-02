---
id: system_design_board
tags:
  - type/moc
  - domain/game_design
  - status/stable
aliases:
  - System Design
---

# System Design Board

## Purpose

Main control board for mechanics intent, balancing, and cross-system links.

## Navigation

- [[20_Game_Design/MOC_Game_Design|Game Design Hub (Hybrid A+C)]]
- [[20_Game_Design/90_Game_Loops/MOC_Game_Loops|Game Loops Board]]
- [[20_Game_Design/01_Mind/Skill_Impact_Map|Skill Impact Map]]

## Core systems

- [[Sys_Investigation]]
- [[Sys_MindPalace]]
- [[Sys_Battle]]
- [[Inventory_Merchant]]
- [[Sys_FogOfWar]]

## In design

- [[note_map_lifecycle_rules]]
- [[note_skill_check_tuning]]

## Rules

- System notes describe intent first, implementation second.
- Every system change must include a test or verification anchor.
- If behavior in code changed, update intent note in the same cycle.
- Every new mechanic note must be mapped to one handbook domain (`01..04`) and at least one game loop.
- If a mechanic change alters scene flow, update related `node_*` notes under `Narrative_Gameplay_Protocol`.
