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
- Beat 1 (HBF surface): free exploration hub with newspaper boy, luggage counter, police post, or exit.
- Beat 2 (newspaper boy): two routes.
  - Buy path reads the mayor's reward notice: anyone connected with criminology, medicine, chemistry, locks, police work, or useful information may help the Bankhaus Krebs investigation for payment.
  - Watch-chain burst: `attr_agility` DC 11 catches the boy. Failure opens `quest_watch_recovery` instead of blocking progress.
  - Observe path reads the boy as a pickpocket and extracts the mayor-reward lead without triggering the theft.
- Beat 3 (pressure checks): luggage counter and police post expose institutional resistance without turning the station into permanent noir.
- Safety rule: all fail states keep forward momentum, but failures leave a price, debt, rumor, or worse route.

## State Delta

- Flags set:
  - `beat1_choice_authority` or `beat1_choice_perception` or `beat1_choice_intuition`
  - `case01_mayor_reward_notice_seen` (optional)
  - `case01_forensics_reward_lead_seen` (optional)
  - `case01_newsboy_caught` / `case01_newsboy_spared` / `case01_newsboy_handed_to_police` (optional)
  - `case01_watch_stolen` and `case01_watch_recovery_open` on failed watch-chain catch
  - `case01_hbf_police_cover_suspected` if the theft is reported and the post stonewalls
  - `arrived_at_hbf`
  - `map_tutorial_shown`
- Evidence gained/lost:
  - none (clues are represented as flags in this onboarding slice).
- Quest stage changes:
  - `quest_watch_recovery` -> stage 1 only if the boy escapes with Matthias' watch.
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
