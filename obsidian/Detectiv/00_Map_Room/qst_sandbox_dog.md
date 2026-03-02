---
id: qst_sandbox_dog
tags:
  - type/quest
  - status/wip
  - city/karlsruhe
  - pack/ka1905
  - optional/true
---

# Quest: Mayor's Dog (Optional)

## Premise

The mayor's beloved dachshund Bruno has gone missing. A comedic side quest that teaches NPC breadcrumb navigation — each NPC points to the next until the dog is found in the Schlossgarten.

## Stage Table

| Stage     | Goal                         | Anchor                       |
| --------- | ---------------------------- | ---------------------------- | ---------------- |
| started   | Talk to the mayor at Rathaus | [[00_Map_Room/loc_ka_rathaus | loc_ka_rathaus]] |
| tracking  | Follow the breadcrumb trail  | [[00_Map_Room/loc_ka_butcher | loc_ka_butcher]] |
| searching | Continue trail to bakery     | [[00_Map_Room/loc_ka_bakery  | loc_ka_bakery]]  |
| resolved  | Find Bruno in the park       | [[00_Map_Room/loc_ka_park    | loc_ka_park]]    |

## Mechanics Taught

- **MapPoint breadcrumb chain** (NPC conversation → unlock next point)
- Optional quest pattern (no hard dependency for sandbox completion)

## Tone

Light comedic. Bruno is always one step ahead. Each NPC gives a humorous account of the dog's antics.

## Code Reference

- `apps/web/src/features/quests/sandbox_dog.logic.ts`
