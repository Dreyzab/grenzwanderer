---
id: node_case1_archive_warrant_run
aliases:
  - Node: Case 1 Archive Warrant Run
tags:
  - type/node
  - status/active
  - layer/vn
  - phase/case01
  - loop/investigation
---

# Node: Case 1 Archive Warrant Run

## Trigger Source

- Runtime route: `/vn/detective_case1_archive_search`.
- Map source: `loc_freiburg_archive` binding in `apps/server/src/scripts/data/case_01_points.ts`.
- Narrative source: post-lead hub dossier step after the official route has turned evidence into access.
- Runtime anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/03_archive/case1_archive.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/03_archive/case1_archive.en.ts`

## Preconditions

- Full archive branch expects all lead completion flags:
  - `tailor_lead_complete=true`
  - `apothecary_lead_complete=true`
  - `pub_lead_complete=true`
- Recommended quest stage on entry: `case01=leads_open`.
- Recovery branch is always available:
  - if lead set is incomplete, node routes to an archive refusal/hint scene and returns control to map (no lockout).
- Critical-path safety:
  - no hard fail without recovery; player is redirected to unresolved lead work.

## Named Cast

- [[30_World_Intel/Characters/char_inspector|char_inspector]] - tries to turn bundle logic into document access.
- [[30_World_Intel/Characters/char_archive_keeper|char_archive_keeper]] - record custodian and procedural gate.
- [[30_World_Intel/Characters/char_official|char_official]] - Dr. Emil Hegenauer, political minder ensuring the wrong file does not surface.

## Designer View

- Player intent: convert dispersed lead clues into one actionable case packet.
- Dramatic function: procedural compression and strategic commitment.
- Narrative function: move from open investigation to directed operation.
- Emotional tone: constrained, bureaucratic pressure with growing certainty.
- Stakes: quality of archive packet determines whether the operation is lawful-strong or limited-risk.

## Mechanics View

- Node type: investigation hub with fail-forward resolution.
- Core loop:
  - run three archive checks;
  - compile packet;
  - branch by quality threshold.
- Skill checks:
  - `chk_case1_archive_encyclopedia_registry` (`encyclopedia`, diff 10)
  - `chk_case1_archive_perception_stamps` (`perception`, diff 9)
  - `chk_case1_archive_tradition_charter` (`tradition`, diff 11)
- Resolution rule:
  - 2+ successful checks -> strong packet.
  - otherwise -> partial packet shaped by Hegenauer-limited access.
- Rewards:
  - new archive evidence items;
  - quest stage progression;
  - warehouse route unlock.

## State Delta

- Always on completion (strong or partial):
  - `archive_casefile_complete=true`
  - `archive_warrant_run_complete=true`
  - `all_leads_resolved=true`
  - `finale_unlocked=true`
  - quest stage: `case01=leads_done`
  - map unlock: `loc_freiburg_warehouse`
- Strong packet outcome:
  - `warrant_ready=true`
  - `archive_access_limited=false`
- Partial packet outcome:
  - `warrant_ready=false`
  - `archive_access_limited=true`
- Evidence examples:
  - `ev_archive_property_ledger`
  - `ev_archive_shift_log`
  - `ev_archive_municipal_charter`

## Transitions

- Strong packet -> [[10_Narrative/Scenes/node_case1_warehouse_entry_plan|Node: Case 1 Warehouse Entry Plan]]
- Partial packet -> [[10_Narrative/Scenes/node_case1_warehouse_entry_plan|Node: Case 1 Warehouse Entry Plan]] (limited access state)
- Incomplete lead fallback -> return to lead map loop via [[10_Narrative/Scenes/node_case1_first_lead_selection|Node: Case 1 First Lead Selection]]
- Recovery rule:
  - any failed archive check still permits progression through partial packet branch.

## Validation

- Runtime validation:
  - archive scenario loads from localized logic/content pair.
  - warehouse marker remains inaccessible until `archive_casefile_complete=true`.
  - stage transition to `leads_done` happens on archive resolution.
- Done criteria:
  - [x] Includes required node contract sections.
  - [x] Keeps critical path recoverable.
  - [x] Syncs map binding and runtime flags in same cycle.
  - [x] Uses a named archive custodian plus named political minder rather than anonymous friction.
- Checklist status:
  - [x] Narrative_Gameplay_Protocol reviewed.
  - [x] Narrative_Gameplay_Checklist constraints applied.
