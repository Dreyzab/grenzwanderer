---
id: narrative_gameplay_protocol
tags:
  - type/policy
  - status/active
  - domain/narrative
  - domain/game_design
aliases:
  - Narrative Gameplay Protocol
  - Story Gameplay SOP
---

# Narrative + Gameplay Protocol

## Purpose

Single production contract for designing, implementing, and validating flow nodes where story and mechanics meet.

## Core Unit

- One note = one flow node (`node_*`).
- One node must answer both views:
  - Designer view: fantasy, dramatic function, emotional intent.
  - Implementation view: trigger, conditions, mechanics, state delta, transitions, anchors.

## Runtime Layers

- `layer/ui`: menu, button, route entry points.
- `layer/vn`: dialogue scene logic and choices.
- `layer/map`: location actions and unlocks.
- `layer/system`: cross-scene gates, onboarding, progression routing.
- `layer/runtime`: orchestrator, transition safety, async effect guards.

Each node must declare exactly one primary layer.

## Mandatory Node Contract

Every `node_*` note must include these sections:

1. `Trigger Source`
2. `Preconditions`
3. `Designer View`
4. `Mechanics View`
5. `State Delta`
6. `Transitions`
7. `Validation`

## Preconditions Protocol

Node entry must declare:

- required flags
- required evidence/items
- required quest stage
- allowed fallback when requirements are missing

Use explicit values (`none` is allowed) to avoid hidden assumptions.

## Mechanics Protocol

For each node:

- Declare player verb (what the player is doing).
- Declare mechanics used (checks, dialogue choice, unlock, resource spend).
- Declare whether node is:
  - informational (no risk)
  - decision node (branching)
  - resolution node (pays off previous risk)

## Skill Check Protocol

When checks exist, each check must define:

- voice id (canonical roster only)
- difficulty
- pass outcome
- fail outcome
- state impact for both outcomes

Rules:

- No mandatory hard fail dead-end.
- Failure must still progress (soft fail, cost, reroute, delayed advantage).
- If a check gates critical path, provide at least one recovery route.

## State Delta Protocol

State changes must be declared by category:

- flags set/unset
- evidence gained/lost
- quest stage changes
- map unlock/visibility changes
- resources (xp, money, consumables)
- relationship deltas

If category has no change, write `none`.

Runtime alignment (v2):

- write state changes as patch intent where possible (`set_flag`, `add_flags`, `add_evidence`, `set_quest_stage`, `set_point_state`, `set_passive_check_result`, `update_voice_state`)
- avoid proposing full snapshot replacement for runtime hot path
- group per-node state changes so one runtime tick can commit a single batched delta

## Transition Protocol

- Transitions must be explicit and named.
- At minimum, decision/check nodes include:
  - success path
  - fail or soft-fail path
  - cancel/exit path (if player can back out)
- Every transition target must be a real node note or an explicit runtime endpoint.
- For scene-changing outcomes, document transition as atomic:
  - apply state delta
  - commit scene transition
  - emit non-blocking async effects
- If transition is in-flight, do not allow secondary scene-changing choice in the same node.

## Async Effect Safety

- Async flavor output (for example Parliament AI thoughts) is additive only.
- Node logic must remain valid if async effects are delayed, dropped, or timed out.
- Stale async output from previous scene/scenario must not be treated as canonical node feedback.

## Chain Governance

Canonical start chain:

1. `node_start_game_new_investigation`
2. `node_intro_char_creation`
3. `node_telegram_gate_after_creation`
4. `node_case1_alt_briefing_entry`
5. `node_map_action_bank_crime_scene`
6. `node_case1_bank_investigation`
7. `node_case1_first_lead_selection`

New chains should follow the same handoff style: `entry -> briefing -> map action -> investigation hub -> lead selection`.

## Code Sync Protocol

For each changed node:

- Add/refresh code anchors.
- Add at least one test anchor.
- Sync affected board notes.
- If runtime behavior changes, update Obsidian note in the same cycle.

## Done Criteria

Node or chain is production-ready when:

- Node contract is complete.
- `Narrative_Consistency_Checklist` passes.
- `Narrative_Gameplay_Checklist` passes.
- Gameplay_Story_Board chain links are updated.
