---
id: node_case1_hbf_arrival
aliases:
  - Node: Case 1 HBF Arrival
tags:
  - type/node
  - status/active
  - layer/vn
  - phase/start
  - loop/exploration
---

# Node: Case 1 HBF Arrival

## Trigger Source

- Route: `/vn/detective_case1_hbf_arrival`.
- Source node: [[10_Narrative/Scenes/node_telegram_gate_after_creation|Node: Telegram Gate After Creation]].
- Runtime handoff: `VisualNovelPage` telegram completion navigates to HBF arrival.
- Code anchors:
  - `apps/web/src/pages/VisualNovelPage/VisualNovelPage.tsx`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/00_onboarding/case1_hbf_arrival.logic.ts`

## Preconditions

- Required flags: `telegram_acknowledged=true`.
- Required evidence/items: none.
- Required quest stage: none.
- Recovery route if missing requirements:
  - return to [[10_Narrative/Scenes/node_telegram_gate_after_creation|Node: Telegram Gate After Creation]].

## Designer View

- Dramatic function: setup through friction, not exposition.
- Intent: player learns city context via fast micro-choices and passive reads.
- Tone: disorientation -> control -> mission focus.
- Pacing target: 3 beats, 20-30 seconds each, no text walls.

## Mechanics View

- Node type: decision node.
- Beat 1 (platform collision): 3 choices + passive check.
  - Passive: `perception` DC 7 -> `clue_marked_schedule` on success.
- Beat 2 (kiosk/newspaper): 2 choices + passive check.
  - Passive: `intuition` DC 6 -> `clue_kiosk_nervousness` on success.
  - Buy path sets `clue_hartmann_newspaper` and `item_newspaper_case01`.
- Beat 3 (station square): 3 choices + passive check.
  - Passive: `senses` DC 7 -> `clue_galdermann_mention` on success.
- Safety rule: all fail states keep forward momentum.

## State Delta

- Flags set:
  - `beat1_choice_authority` or `beat1_choice_perception` or `beat1_choice_intuition`
  - `newspaper_bought` (optional)
  - `item_newspaper_case01` (optional)
  - `clue_hartmann_newspaper` (optional)
  - `arrived_at_hbf`
  - `map_tutorial_shown`
- Evidence gained/lost:
  - none (clues are represented as flags in this onboarding slice).
- Quest stage changes:
  - `case01` -> `briefing` on node entry.
- Map unlock/visibility changes:
  - unlock `loc_hbf` on finalize.
- Resources:
  - none.
- Relationship deltas:
  - none.

## Transitions

- Success path: node end -> [[10_Narrative/Scenes/node_case1_alt_briefing_entry|Node: Case 1 Alt Briefing Entry]].
- Fail/soft-fail path: all passive check fails still continue to next beat.
- Cancel/exit path: if VN exits early, player can re-enter flow via `loc_hbf` marker.

## Validation

- Confirm 3 beats execute in fixed order.
- Confirm passive checks are resolved once per beat.
- Confirm no fail result blocks transition to briefing node.
- Confirm finalize sets `arrived_at_hbf` and unlocks `loc_hbf`.
- Test anchor:
  - `apps/web/src/pages/VisualNovelPage/VisualNovelPage.tsx`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/00_onboarding/case1_hbf_arrival.logic.ts`
