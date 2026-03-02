---
id: qst_sandbox_ghost
tags:
  - type/quest
  - status/wip
  - city/karlsruhe
  - pack/ka1905
  - mechanic/deduction
---

# Quest: Haunted Estate

## Premise

Reports of ghostly phenomena at the von Hagen estate. The player investigates, collects 4 evidence items, and must choose between two deduction paths — this teaches the evidence combining mechanic.

## Stage Table

| Stage          | Goal                                    | Anchor                      |
| -------------- | --------------------------------------- | --------------------------- | --------------- |
| started        | Hear rumors about the estate            | [[00_Map_Room/loc_ka_estate | loc_ka_estate]] |
| investigating  | Search the estate, find evidence        | loc_ka_estate               |
| evidence_found | All 4 evidence items collected          | -                           |
| guild_visited  | Learn deduction at the Guild            | [[00_Map_Room/loc_ka_guild  | loc_ka_guild]]  |
| deduction_made | Combine evidence → true or false trail  | Mind Palace                 |
| resolved       | Conclude case based on chosen deduction | loc_ka_estate               |

## Evidence Items

| ID                     | Description                       |
| ---------------------- | --------------------------------- |
| `ev_cold_draft`        | Supernatural cold anomaly         |
| `ev_hidden_passage`    | Secret corridor behind bookshelf  |
| `ev_servant_testimony` | Witness account of nightly sounds |
| `ev_ectoplasm_residue` | Mysterious substance sample       |

## Deduction Paths

| Path            | Inputs                                       | Result                     |
| --------------- | -------------------------------------------- | -------------------------- |
| **True Trail**  | `ev_cold_draft` + `ev_ectoplasm_residue`     | → Supernatural conclusion  |
| **False Trail** | `ev_hidden_passage` + `ev_servant_testimony` | → Contrabandist conclusion |

## Mechanics Taught

- **Evidence Collection** (4 items)
- **Evidence Combining** (Mind Palace / Detective Board)
- **Branching Deduction** (true vs false trail)
- **Guild Master NPC** as deduction tutorial

## Code Reference

- `apps/web/src/features/quests/sandbox_ghost.logic.ts`
- Evidence: `apps/web/src/features/detective/registries.ts`
- Deductions: `apps/web/src/features/detective/lib/deductions.ts`
