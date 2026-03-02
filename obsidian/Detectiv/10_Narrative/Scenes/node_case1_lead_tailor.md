---
id: node_case1_lead_tailor
aliases:
  - Node: Case 1 Lead - Tailor
tags:
  - type/node
  - status/active
  - layer/vn
  - phase/case01
---

# Node: Case 1 Lead - Tailor

## Trigger Source

- Route: `/vn/lead_tailor`.
- Source node: [[10_Narrative/Scenes/node_case1_first_lead_selection|Node: Case 1 First Lead Selection]].
- Scenario anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/leads/tailor/lead_tailor.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/leads/tailor/lead_tailor.en.ts`

## Preconditions

- Required flags: `bank_investigation_complete=true`.
- Required evidence/items: none (but `found_velvet` opens core branch).
- Required quest stage: `case01=leads_open`.
- Recovery route if missing requirements:
  - return to [[10_Narrative/Scenes/node_case1_first_lead_selection|Node: Case 1 First Lead Selection]].

## Designer View

- Dramatic function: clue-to-logistics conversion.
- Intent: move from material trace to procurement behavior and transfer methods.
- Tone: polite pressure, controlled denial, technical leakage.

## Mechanics View

- Node type: social investigation.
- Core path:
  - `show_fabric` (requires `found_velvet`) -> recognition -> perception check -> suspect profile.
- Legacy clue-payoff branches (kept):
  - `ask_hartmann_orders` (requires `clue_hartmann_internal_contact`) -> `clue_hartmann_tailor_route`.
  - `ask_box217_usage` (requires `clue_box217_sensitive`) -> `clue_box217_costume_storage`.
  - `press_galdermann_name` (requires `clue_galdermann_preseed_confirmed`) -> `clue_galdermann_tailor_denial`.
- New clue-payoff branches:
  - `ask_lock_signature_workshop` (requires `clue_lock_signature`) -> `clue_tailor_heat_source`.
  - `ask_hidden_slot_pattern` (requires `clue_hidden_slot`) -> `clue_hidden_slot_tailor_pattern`.
  - `press_relic_gap` (requires `clue_relic_gap`) -> `clue_relic_tailor_transfer`.
- Check:
  - `chk_tailor_perception` (`perception` DC 10) for ledger extraction.
- Safety rule: node remains playable without optional clue branches.

## State Delta

- Flags set:
  - `tailor_asked_hartmann`
  - `tailor_asked_box217`
  - `tailor_pressed_galdermann`
  - `tailor_asked_lock_signature`
  - `tailor_asked_hidden_slot`
  - `tailor_pressed_relic_gap`
  - `clue_hartmann_tailor_route`
  - `clue_box217_costume_storage`
  - `clue_galdermann_tailor_denial`
  - `clue_tailor_heat_source`
  - `clue_hidden_slot_tailor_pattern`
  - `clue_relic_tailor_transfer`
  - `saw_tailor_ledger` (perception success)
  - `tailor_lead_complete`
- Evidence gained:
  - `ev_tailor_ledger_entry` (perception success).
- Map unlock/visibility changes:
  - unlock `loc_student_house`.
  - unlock `loc_street_event`.
  - unlock `loc_telephone`.
- Quest stage changes:
  - none in this node.

## Transitions

- Success path: END -> map with new unlocked points.
- Fail/soft-fail path: perception fail still yields route progression.
- Cancel path: leave shop -> END -> map.

## Validation

- Confirm new clue-conditioned options appear only with required flags.
- Confirm legacy clue-conditioned branches still work unchanged.
- Confirm perception success grants `ev_tailor_ledger_entry` and preserves progression.
- Confirm node completion unlocks `loc_student_house`, `loc_street_event`, `loc_telephone`.
- Test anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/leads/tailor/lead_tailor.logic.ts`
