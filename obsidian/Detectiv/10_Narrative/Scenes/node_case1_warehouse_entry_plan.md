---
id: node_case1_warehouse_entry_plan
aliases:
  - Node: Case 1 Warehouse Entry Plan
tags:
  - type/node
  - status/proposed
  - layer/system
  - phase/case01
  - loop/meta
---

# Node: Case 1 Warehouse Entry Plan

## Trigger Source

- Route: system handoff before warehouse finale.
- Source node:
  - [[10_Narrative/Scenes/node_case1_archive_warrant_run|Node: Case 1 Archive Warrant Run]]
  - [[10_Narrative/Scenes/node_case1_rail_yard_shadow_tail|Node: Case 1 Rail Yard Shadow Tail]]
- Planned anchors:
  - `apps/web/src/features/quests/case01_act1.logic.ts` (stage transition to `finale`).
  - `apps/server/src/scripts/data/case_01_points.ts` (warehouse start action selection).

## Preconditions

- Required flags:
  - `warrant_ready=true` or `covert_entry_ready=true`
  - `archive_warrant_run_complete=true` or `rail_yard_shadow_tail_complete=true`
- Required evidence/items:
  - none (bundle quality modifies risk, not entry permission).
- Required quest stage: `case01=leads_open` or `case01=leads_done`.
- Fallback if missing requirements:
  - route back to whichever preparation branch is missing.

## Designer View

- Player intent: lock operational approach before final confrontation.
- Dramatic function: decision.
- Narrative function: convert investigation style into finale entry profile.
- Emotional tone: tense preparation, point-of-no-return.
- Stakes: selected entry mode defines initial conditions of finale and reputation aftermath.

## Mechanics View

- Player verb: commit route and loadout strategy.
- Node type: decision.
- Mechanics used:
  - route mode selection (`lawful_raid` or `covert_breach`);
  - readiness validation;
  - optional reroute when requirements are incomplete.
- Skill checks: none mandatory in planner node.
- Resources:
  - optional prep spend (funds/items) for lower-risk entry.
- Rewards:
  - stage transition to finale with deterministic entry flags.

## State Delta

- Flags set:
  - `warehouse_plan_locked`
  - `entry_mode_lawful` or `entry_mode_covert`
  - optional: `finale_entry_advantage`
- Flags unset:
  - opposite entry mode flag.
- Evidence gained: none.
- Evidence lost: none.
- Quest stage changes:
  - `case01` -> `finale` (planned).
- Map unlock/visibility changes:
  - marks `loc_freiburg_warehouse` as active finale destination.
- Resources (xp/money/items):
  - optional prep spend.
- Relationship deltas:
  - lawful route may improve civic trust;
  - covert route may improve shadow trust.

## Transitions

- Success -> [[10_Narrative/Scenes/node_case1_finale_resolution_split|Node: Case 1 Finale Resolution Split]]
- Soft fail -> [[10_Narrative/Scenes/node_case1_archive_warrant_run|Node: Case 1 Archive Warrant Run]]
- Cancel -> [[10_Narrative/Scenes/node_case1_archive_warrant_run|Node: Case 1 Archive Warrant Run]]
- Recovery -> [[10_Narrative/Scenes/node_case1_rail_yard_shadow_tail|Node: Case 1 Rail Yard Shadow Tail]]

## Validation

- Test anchor:
  - planned quest-stage assertions around `case01=finale`.
- Done criteria:
  - planner always sets a single entry mode and preserves progression;
  - no branch can bypass finale stage transition.
- Checklist status:
  - [ ] Narrative_Consistency_Checklist
  - [ ] Narrative_Gameplay_Checklist
