---
id: qst_sandbox_banker
tags:
  - type/quest
  - status/wip
  - city/karlsruhe
  - pack/ka1905
  - mechanic/battle
---

# Quest: Banker's Son

## Premise

A concerned banker hires the detective to find out why his son Friedrich vanishes every night. Trail leads through the son's apartment and tavern contacts to a secret gambling den, culminating in a card duel (⚔️ tutorial).

## Stage Table

| Stage         | Goal                                              | Anchor                         |
| ------------- | ------------------------------------------------- | ------------------------------ | ------------------ |
| investigation | Meet the banker at the bank                       | [[00_Map_Room/loc_ka_bank      | loc_ka_bank]]      |
| trail         | Search Friedrich's apartment, find gambling clues | [[00_Map_Room/loc_ka_son_house | loc_ka_son_house]] |
| confrontation | Gather intel at tavern, locate the casino         | [[00_Map_Room/loc_ka_tavern    | loc_ka_tavern]]    |
| resolved      | Card duel with Friedrich at the casino            | [[00_Map_Room/loc_ka_casino    | loc_ka_casino]]    |

## Mechanics Taught

- **Card Duel System** (Dialogue Battle)
- Point-to-point investigation flow

## Battle

- Scenario: `sandbox_son_duel`
- Opponent: Friedrich Richter
- Difficulty: Easy (Resolve 15 vs Player 25)

## Code Reference

- `apps/web/src/features/quests/sandbox_banker.logic.ts`
