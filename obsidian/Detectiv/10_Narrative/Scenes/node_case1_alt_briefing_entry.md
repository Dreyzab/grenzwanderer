---
id: node_case1_alt_briefing_entry
aliases:
  - Node: Case 1 Alt Briefing Entry
tags:
  - type/node
  - status/active
  - layer/vn
  - phase/briefing
  - loop/social
---

# Node: Case 1 Alt Briefing Entry

## Trigger Source

- Route: `/vn/detective_case1_alt_briefing`.
- Source node: [[10_Narrative/Scenes/node_case1_hbf_arrival|Node: Case 1 HBF Arrival]].
- Runtime handoff: HBF scenario end is routed by `VisualNovelPage`.
- Code anchors:
  - `apps/web/src/pages/VisualNovelPage/VisualNovelPage.tsx`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/01_briefing/case1_alt_briefing.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/01_briefing/case1_alt_briefing.en.ts`

## Preconditions

- Required flags: `arrived_at_hbf=true`.
- Required evidence/items: none.
- Required quest stage: none.
- Recovery route if missing requirements:
  - redirect to [[10_Narrative/Scenes/node_case1_hbf_arrival|Node: Case 1 HBF Arrival]].

## Designer View

- Dramatic function: complication and mission framing.
- Intent: assign mission under political pressure while preserving ambiguity.
- Tone: time pressure, controlled distrust, tactical exchange.
- Reveal policy: indicate mass sleep + selective losses, avoid hard supernatural confirmation.

## Mechanics View

- Node type: decision node.
- Beat 1: choose briefing tactic.
  - `professional` / `harsh` / `soft`.
- Beat 2: choose intel angle.
  - `intel_vault_box_unknown` or `intel_inspector_weiss`.
  - Scene text now frames facts as: synchronized witness sleep, selective losses, cover-story pressure.
  - Passive check: `empathy` DC 7 -> `clue_clara_personal_stake` on success.
- Beat 3: choose tactical bonus.
  - Professional -> `contact_boehme`.
  - Harsh -> `clue_previous_investigator`.
  - Soft -> `rumor_night_guard`.
  - Active check: `logic` DC 8 -> `clue_coverup_suspicion` on success.
- Beat 4: exit framing, then finalize.
- Safety rule: logic fail does not block mission start.

## State Delta

- Flags set:
  - one of `briefing_tactic_professional` / `briefing_tactic_harsh` / `briefing_tactic_soft`
  - one of `intel_vault_box_unknown` / `intel_inspector_weiss`
  - `case01_started`
  - `clara_introduced`
  - `alt_briefing_completed`
  - `item_briefing_envelope`
  - optional clues from checks/bonus choices.
- Evidence gained/lost:
  - none.
- Quest stage changes:
  - `case01` -> `briefing` (finalize).
- Map unlock/visibility changes:
  - unlock `loc_freiburg_bank`.
- Resources:
  - none.
- Relationship deltas:
  - Clara relation can change by tactic and exit choice.

## Transitions

- Success path: node end -> [[10_Narrative/Scenes/node_case1_map_first_exploration|Node: Case 1 Map First Exploration]] (map auto-start rule).
- Fail/soft-fail path: logic fail still goes to finalize.
- Cancel/exit path: if player leaves VN, flow is recoverable from map with unlocked bank progression path.

## Validation

- Confirm 4-beat sequence with inputs between beats.
- Confirm only one tactical bonus is granted per run.
- Confirm logic fail does not dead-end progression.
- Confirm finalize sets `alt_briefing_completed` and unlocks `loc_freiburg_bank`.
- Test anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/01_briefing/case1_alt_briefing.logic.ts`
  - `apps/web/src/widgets/map/map-view/MapView.tsx`
