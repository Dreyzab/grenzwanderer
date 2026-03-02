---
id: moc_game_design
tags:
  - type/moc
  - domain/game_design
  - structure/hybrid_ac
aliases:
  - Game Design Hub
  - Detective Handbook
---

# Game Design Hub (Hybrid A + C)

Primary axis: thematic handbook (Option C).  
Secondary axis: game loops for balancing (Option A).

## Handbook domains (primary)

- [[01_Mind/READ_ME|01 Mind]]
- [[02_Investigation/READ_ME|02 Investigation]]
- [[03_Interaction/READ_ME|03 Interaction]]
- [[04_World/READ_ME|04 World]]

## Loop view (secondary)

- [[90_Game_Loops/MOC_Game_Loops|MOC Game Loops]]

## Cross-layer index

- [[99_System/MOC_Engines|MOC Engines]]
- [[99_System/Runtime_Orchestrator_v2|Runtime Orchestrator v2]]
- [[99_System/API_Engine_Contract|API Engine Contract]]

## Existing source notes

- [[20_Game_Design/Systems/Sys_MindPalace|Sys MindPalace]]
- [[20_Game_Design/Systems/Sys_Investigation|Sys Investigation]]
- [[20_Game_Design/Systems/Sys_Battle|Sys Battle]]
- [[20_Game_Design/Systems/Inventory_Merchant|Inventory and Merchant]]
- [[20_Game_Design/Systems/Sys_FogOfWar|Sys FogOfWar]]
- [[20_Game_Design/Voices/MOC_Parliament|Parliament of Voices]]

## Linking rule

Each new mechanic note should explicitly include:

- a primary handbook domain (`01_Mind`, `02_Investigation`, `03_Interaction`, `04_World`);
- one or more loops from `90_Game_Loops`;
- code anchors when feature already exists in project.
- and when runtime behavior changes, sync with [[99_System/Runtime_Orchestrator_v2|Runtime Orchestrator v2]].
