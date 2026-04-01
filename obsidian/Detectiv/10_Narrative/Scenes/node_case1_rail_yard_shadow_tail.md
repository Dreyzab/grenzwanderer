---
id: node_case1_rail_yard_shadow_tail
aliases:
  - Node: Case 1 Rail Yard Shadow Tail
tags:
  - type/node
  - status/proposed
  - layer/map
  - phase/case01
  - loop/exploration
---

# Node: Case 1 Rail Yard Shadow Tail

## Trigger Source

- Route: `/map` (travel and intercept sequence).
- Source node:
  - [[10_Narrative/Scenes/node_case1_workers_backchannel|Node: Case 1 Workers Backchannel]]
  - or soft-fail from [[10_Narrative/Scenes/node_case1_archive_warrant_run|Node: Case 1 Archive Warrant Run]].
- Planned anchors:
  - `apps/server/src/scripts/data/case_01_points.ts` (rail-yard interaction binding).
  - `apps/web/src/widgets/map/map-view/MapView.tsx` (travel state handling).

## Preconditions

- Required flags:
  - `workers_backchannel_complete=true` or `archive_warrant_run_complete=true`
  - `covert_entry_ready=true` or `warrant_manifest_partial=true`
- Required evidence/items: none.
- Required quest stage: `case01=leads_open`.
- Fallback if missing requirements:
  - return to [[10_Narrative/Scenes/node_case1_archive_warrant_run|Node: Case 1 Archive Warrant Run]].

## Named Cast

- [[30_World_Intel/Characters/char_inspector|char_inspector]] - shadows the last visible movement before the warehouse.
- [[30_World_Intel/Characters/char_dock_worker|char_dock_worker]] - Jakob Moser, the night-shift lookout whose timing governs the covert window.

## Designer View

- Player intent: identify and exploit the safe timing window to approach the warehouse.
- Dramatic function: consequence.
- Narrative function: convert route choice into tactical position before finale.
- Emotional tone: nocturnal, dangerous, time-constrained.
- Stakes: determines entry penalties and initiative at warehouse approach.

## Mechanics View

- Player verb: shadow Jakob Moser, position, and breach timing.
- Node type: decision.
- Mechanics used:
  - map movement timing;
  - stealth/intrusion checks;
  - risk-cost fallback on failure.
- Skill checks:
  - Check id: `chk_case1_tail_stealth_platform`
    - Voice id: `stealth`
    - Difficulty: 10
    - On pass: `tail_unseen=true`
    - On fail: `tail_spotted=true`
  - Check id: `chk_case1_tail_intrusion_gate`
    - Voice id: `intrusion`
    - Difficulty: 9
    - On pass: `covert_entry_ready=true`
    - On fail: `covert_entry_costly=true`
- Resources:
  - optional consumable or money cost on spotted path.
- Rewards:
  - tighter warehouse entry conditions and reduced confrontation heat.

## State Delta

- Flags set:
  - `rail_yard_shadow_tail_complete`
  - `tail_unseen` or `tail_spotted`
  - `covert_entry_ready` or `covert_entry_costly`
- Flags unset: none.
- Evidence gained:
  - `ev_rail_schedule_scrap` (planned).
- Evidence lost: none.
- Quest stage changes: none.
- Map unlock/visibility changes:
  - confirms approach action on `loc_freiburg_warehouse`.
- Resources (xp/money/items):
  - stealth/intrusion XP;
  - optional cost in fail branch.
- Relationship deltas:
  - none.

## Transitions

- Success -> [[10_Narrative/Scenes/node_case1_warehouse_entry_plan|Node: Case 1 Warehouse Entry Plan]]
- Soft fail -> [[10_Narrative/Scenes/node_case1_warehouse_entry_plan|Node: Case 1 Warehouse Entry Plan]]
- Cancel -> [[10_Narrative/Scenes/node_case1_archive_warrant_run|Node: Case 1 Archive Warrant Run]]
- Recovery -> [[10_Narrative/Scenes/node_case1_archive_warrant_run|Node: Case 1 Archive Warrant Run]]

## Validation

- Test anchor:
  - planned map interaction tests for spotted/unseen branch outcomes.
- Done criteria:
  - both check outcomes keep player moving to warehouse entry plan;
  - no hard fail even when both checks fail;
  - Jakob Moser is the named lookout mediating the stealth obstacle.
- Checklist status:
  - [ ] Narrative_Consistency_Checklist
  - [ ] Narrative_Gameplay_Checklist
