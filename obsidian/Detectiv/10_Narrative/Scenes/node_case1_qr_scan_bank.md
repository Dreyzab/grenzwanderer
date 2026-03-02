---
id: node_case1_qr_scan_bank
aliases:
  - Node: Case 1 QR Scan Bank
tags:
  - type/node
  - status/active
  - layer/vn
  - phase/case01
  - loop/investigation
---

# Node: Case 1 QR Scan Bank

## Trigger Source

- Route: `/vn/detective_case1_qr_scan_bank`.
- Source node: [[10_Narrative/Scenes/node_case1_map_first_exploration|Node: Case 1 Map First Exploration]].
- Runtime trigger: map marker binding on `loc_freiburg_bank` when `qr_scanned_bank=false`.
- Code anchors:
  - `apps/server/src/scripts/data/case_01_points.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/00_onboarding/case1_qr_scan_bank.logic.ts`
  - `apps/web/src/pages/VisualNovelPage/VisualNovelPage.tsx`

## Preconditions

- Required flags:
  - `near_bank=true` (set by map exploration finalize).
- Required evidence/items: none.
- Required quest stage: none.
- Recovery route if missing requirements:
  - player remains on map; bank marker can re-trigger gate action.

## Designer View

- Dramatic function: threshold transition from travel loop to on-site investigation loop.
- Intent: short gate interaction, no friction dead-end.
- Tone: procedural handoff into core case scene.

## Mechanics View

- Node type: resolution gate.
- Choices:
  - `qr_scan_now` -> success.
  - `qr_manual_code` -> manual confirm or retry.
  - `qr_skip_legacy` -> soft bypass, still continues.
- No skill checks.
- Safety rule: every path can reach `qr_success`.

## State Delta

- Flags set:
  - `qr_scanned_bank`
  - `bank_location_entered`
  - optional: `qr_bypassed_bank`
- Flags unset/overwritten:
  - `near_bank=false` on success.
- Evidence gained/lost:
  - none.
- Quest stage changes:
  - `case01` -> `bank_investigation` on success.
- Map unlock/visibility changes:
  - unlock `loc_freiburg_bank` on success action.
- Resources:
  - none.
- Relationship deltas:
  - none.

## Transitions

- Success path: node end -> [[10_Narrative/Scenes/node_case1_bank_investigation|Node: Case 1 Bank Investigation]].
- Fail/soft-fail path: manual retry and legacy bypass route both preserve momentum.
- Cancel/exit path: return to map at bank marker.

## Validation

- Confirm all three entry choices can complete gate flow.
- Confirm success sets `qr_scanned_bank=true` and quest stage `bank_investigation`.
- Confirm `VisualNovelPage` routes scenario end to `/vn/detective_case1_bank_scene`.
- Test anchor:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/00_onboarding/case1_qr_scan_bank.logic.ts`
  - `apps/web/src/pages/VisualNovelPage/VisualNovelPage.tsx`
