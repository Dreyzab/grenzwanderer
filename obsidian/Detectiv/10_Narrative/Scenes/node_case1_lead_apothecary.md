---
id: node_case1_lead_apothecary
aliases:
  - Node: Case 1 Lead - Apothecary
tags:
  - type/node
  - status/active
  - layer/vn
  - phase/case01
---

# Node: Case 1 Lead - Apothecary

## Trigger Source

- Route: `/vn/lead_apothecary`.
- Source node: [[10_Narrative/Scenes/node_case1_first_lead_selection|Node: Case 1 First Lead Selection]].
- Scenario anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/leads/apothecary/lead_apothecary.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/leads/apothecary/lead_apothecary.en.ts`

## Preconditions

- Required flags: `bank_investigation_complete=true`.
- Required evidence/items: none (but `found_residue` opens core analysis branch).
- Required quest stage: `case01=leads_open`.
- Recovery route if missing requirements:
  - return to [[10_Narrative/Scenes/node_case1_first_lead_selection|Node: Case 1 First Lead Selection]].

## Designer View

- Dramatic function: technical confirmation and supply-chain narrowing.
- Intent: connect sedation + breach chemistry to institutional procurement.
- Tone: clinical, precise, transactional.

## Mechanics View

- Node type: technical interview.
- Core path:
  - `show_residue` (requires `found_residue`) -> analysis -> source inference.
- Legacy clue-payoff branches (kept):
  - `ask_sender_manifest` (requires `clue_chemical_sender`) -> `clue_chemical_sender_confirmed`.
  - `ask_hartmann_procurement` (requires `clue_hartmann_internal_contact`) -> `clue_hartmann_chemical_orders`.
  - `crosscheck_sender_chain` (requires `clue_sender_residue_match`) -> `clue_sender_route_to_kiliani` + evidence note.
- New clue-payoff branches:
  - `ask_sleep_agent_profile` (requires `clue_sleep_agent`) -> `clue_sleep_agent_confirmed`.
  - `ask_relic_chain` (requires `clue_relic_gap`) -> `clue_relic_preservative_chain`.
  - `crosscheck_lock_signature` (requires `clue_lock_signature`) -> `clue_lock_cooling_agent`.
- Check:
  - `chk_apothecary_forensics` (`senses` DC 11) for high-confidence formula path.
- Safety rule: all branches return to loop; no hard lock.

## State Delta

- Flags set:
  - `apothecary_asked_sender`
  - `clue_chemical_sender_confirmed`
  - `apothecary_asked_hartmann`
  - `clue_hartmann_chemical_orders`
  - `apothecary_crosschecked_sender`
  - `clue_sender_route_to_kiliani`
  - `apothecary_asked_sleep_agent`
  - `clue_sleep_agent_confirmed`
  - `apothecary_asked_relic_gap`
  - `clue_relic_preservative_chain`
  - `apothecary_checked_lock_signature`
  - `clue_lock_cooling_agent`
  - `knows_university_connection` (forensics success)
  - `apothecary_lead_complete`
- Evidence gained:
  - `ev_powder_analysis`
  - `ev_university_formula` (forensics success)
  - `ev_supplier_registry_note` (sender crosscheck branch)
- Map unlock/visibility changes:
  - unlock `loc_uni_chem`.
  - unlock `loc_telephone`.
- Quest stage changes:
  - none in this node.

## Transitions

- Success path: END -> map with university/telephone follow-ups.
- Fail/soft-fail path: forensics fail still preserves forward movement.
- Cancel path: leave shop -> END -> map.

## Validation

- Confirm legacy and new clue-gated options appear only with corresponding flags.
- Confirm `crosscheck_sender_chain` still yields `clue_sender_route_to_kiliani` and evidence note.
- Confirm node completion unlocks `loc_uni_chem` and `loc_telephone`.
- Test anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/leads/apothecary/lead_apothecary.logic.ts`
