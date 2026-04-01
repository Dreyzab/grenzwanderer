---
id: node_case1_finale_resolution_split
aliases:
  - Node: Case 1 Finale Resolution Split
tags:
  - type/node
  - status/proposed
  - layer/vn
  - phase/case01
  - loop/conflict
---

# Node: Case 1 Finale Resolution Split

## Trigger Source

- Route: finale VN endpoint after warehouse confrontation (planned wrapper around current finale).
- Source node: [[10_Narrative/Scenes/node_case1_warehouse_entry_plan|Node: Case 1 Warehouse Entry Plan]].
- Planned anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/05_finale/case1_finale.logic.ts`
  - `apps/web/src/features/quests/case01_act1.logic.ts`

## Preconditions

- Required flags:
  - `warehouse_plan_locked=true`
  - `entry_mode_lawful=true` or `entry_mode_covert=true`
- Required evidence/items:
  - none mandatory; bundle strength modifies outcome options.
- Required quest stage: `case01=finale`.
- Fallback if missing requirements:
  - return to [[10_Narrative/Scenes/node_case1_warehouse_entry_plan|Node: Case 1 Warehouse Entry Plan]].

## Named Cast

- [[30_World_Intel/Characters/char_inspector|char_inspector]] - carries the final accusation and its moral cost.
- [[30_World_Intel/Characters/char_bank_manager|char_bank_manager]] - Heinrich Galdermann, the explicit confrontation target.
- [[30_World_Intel/Characters/char_warehouse_guard|char_warehouse_guard]] - subordinate muscle and pressure, not the real face of the ending.
- Offstage only: [[30_World_Intel/Characters/char_mastermind|char_mastermind]] remains unseen and unresolved.

## Designer View

- Player intent: close the case with chosen investigative identity.
- Dramatic function: consequence.
- Narrative function: pay off route strategy and clue synthesis in a direct confrontation with Galdermann while preserving the broader network mystery.
- Emotional tone: high pressure, moral cost, hard closure.
- Stakes: resolution style affects trust network and next-case entry context.

## Mechanics View

- Player verb: confront, expose, or contain.
- Node type: resolution.
- Mechanics used:
  - finale branch resolution by route and clue bundles;
  - last-set skill checks;
  - outcome state commit.
- Skill checks:
  - Check id: `chk_case1_finale_logic_chain`
    - Voice id: `logic`
    - Difficulty: 12
    - On pass: lawful close path remains stable
    - On fail: compromise pressure increases
  - Check id: `chk_case1_finale_empathy_break`
    - Voice id: `empathy`
    - Difficulty: 11
    - On pass: witness cooperation preserved
    - On fail: witness reliability drops but case still closes
- Resources:
  - none mandatory.
- Rewards:
  - case closure, quest resolution rewards, and case 02 hook activation.

## State Delta

- Flags set:
  - `case_resolved`
  - `case01_resolved_lawful` or `case01_resolved_compromise`
  - `case02_hook_university_network`
- Flags unset: none.
- Evidence gained:
  - `ev_case01_closure_report` (planned).
- Evidence lost: none.
- Quest stage changes:
  - `case01` -> `resolved`.
- Map unlock/visibility changes:
  - optional reveal of first case 02 investigation point.
- Resources (xp/money/items):
  - case completion rewards (XP and final payout profile by ending).
- Relationship deltas:
  - lawful close: civic trust up, shadow trust down.
  - compromise close: civic trust down, shadow trust up.

## Transitions

- Success (lawful) -> runtime endpoint: map + case02 hook
- Soft fail (compromise) -> runtime endpoint: map + case02 hook
- Cancel -> [[10_Narrative/Scenes/node_case1_warehouse_entry_plan|Node: Case 1 Warehouse Entry Plan]]
- Recovery -> [[10_Narrative/Scenes/node_case1_warehouse_entry_plan|Node: Case 1 Warehouse Entry Plan]]

## Validation

- Test anchor:
  - planned finale outcome assertions in `case1_finale.logic.ts`.
- Done criteria:
  - both lawful and compromise outcomes close the case and enable next-case hook;
  - no ending branch leaves quest unresolved;
  - Galdermann is the direct finale face and the mastermind remains offstage.
- Checklist status:
  - [ ] Narrative_Consistency_Checklist
  - [ ] Narrative_Gameplay_Checklist
