---
id: node_case1_map_first_exploration
aliases:
  - Node: Case 1 Map First Exploration
tags:
  - type/node
  - status/active
  - layer/vn
  - phase/case01
  - loop/exploration
---

# Node: Case 1 Map First Exploration

## Trigger Source

- Route: `/vn/detective_case1_map_first_exploration`.
- Source node: [[10_Narrative/Scenes/node_case1_alt_briefing_entry|Node: Case 1 Alt Briefing Entry]].
- Runtime trigger: map auto-start when:
  - `alt_briefing_completed=true`
  - `case01_map_exploration_intro_done=false`
  - `qr_scanned_bank=false`
  - no active scenario.
- Code anchors:
  - `apps/web/src/widgets/map/map-view/MapView.tsx`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/00_onboarding/case1_map_first_exploration.logic.ts`

## Preconditions

- Required flags:
  - `alt_briefing_completed=true`.
- Required evidence/items: none.
- Required quest stage: none.
- Recovery route if missing requirements:
  - return to [[10_Narrative/Scenes/node_case1_alt_briefing_entry|Node: Case 1 Alt Briefing Entry]].

## Designer View

- Dramatic function: complication through movement-linked clues.
- Intent: map travel should produce actionable signals, not flavor-only interruptions.
- Tone: rising pattern recognition.
- Target output: bank approach plus 2-6 clue flags.

## Mechanics View

- Node type: exploration decision node.
- Event 1 (postman): guaranteed.
  - Two choices, both preserve progression.
  - Always seeds `clue_vault_box_217` and `clue_hartmann_letter`.
  - Passive check: `perception` DC 7 -> `clue_chemical_sender` on success.
- Event 2 gate: player can engage or skip.
  - `linger` -> event 2 scene.
  - `skip` -> direct bank approach.
- Event 2 (student/leaflet): optional.
  - Choice paths seed `clue_galdermann_leaflet` or `clue_fired_clerk`.
  - Passive check: `intuition` DC 8 -> `clue_organized_opposition` on success.
- Finalize sets map handoff flags for QR gate.
- Safety rule: skipping event 2 still reaches bank approach.

## State Delta

- Flags set:
  - `event_postman_triggered`
  - `clue_vault_box_217`
  - `clue_hartmann_letter`
  - optional: `clue_chemical_sender`
  - optional: `event_student_triggered`
  - optional: `clue_galdermann_leaflet`
  - optional: `clue_fired_clerk`
  - optional: `clue_organized_opposition`
  - finalize: `exploration_phase_active`, `case01_map_exploration_intro_done`, `near_bank`.
- Evidence gained/lost:
  - none.
- Quest stage changes:
  - none.
- Map unlock/visibility changes:
  - none directly in node; flow positions player at bank approach gate.
- Resources:
  - none.
- Relationship deltas:
  - none.

## Transitions

- Success path: node end -> [[10_Narrative/Scenes/node_case1_qr_scan_bank|Node: Case 1 QR Scan Bank]].
- Fail/soft-fail path: passive check fails still continue.
- Cancel/exit path: map remains active; clicking bank marker can reopen gate flow.

## Validation

- Confirm auto-start condition in map view fires once.
- Confirm Event 1 always seeds `clue_vault_box_217` and `clue_hartmann_letter`.
- Confirm Event 2 skip still reaches approach finalize.
- Confirm finalize sets `near_bank=true` and `case01_map_exploration_intro_done=true`.
- Test anchor:
  - `apps/web/src/widgets/map/map-view/MapView.tsx`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/00_onboarding/case1_map_first_exploration.logic.ts`
