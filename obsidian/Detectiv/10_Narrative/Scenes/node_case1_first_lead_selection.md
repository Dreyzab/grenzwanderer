---
id: node_case1_first_lead_selection
aliases:
  - Node: Case 1 First Lead Selection
tags:
  - type/node
  - status/active
  - layer/map
  - phase/case01
---

# Node: Case 1 First Lead Selection

## Trigger Source

- Route: `/map` after bank scene conclusion.
- Source node: [[10_Narrative/Scenes/node_case1_bank_investigation|Node: Case 1 Bank Investigation]].
- Runtime unlock action (bank conclusion): `loc_tailor`, `loc_apothecary`, `loc_pub`.
- Data anchor: `apps/server/src/scripts/data/case_01_points.ts`.

## Preconditions

- Required flags: `bank_investigation_complete=true`.
- Required evidence/items: none.
- Required quest stage: `case01=leads_open`.
- Recovery route if missing requirements:
  - return to [[10_Narrative/Scenes/node_case1_bank_investigation|Node: Case 1 Bank Investigation]].

## Designer View

- Dramatic function: strategic fork.
- Intent: choose next pressure vector (material, chemical, social-logistics).
- Tone: agency with informed risk.
- Payoff rule: onboarding + bank clues alter lead depth/reward, not core accessibility.

## Mechanics View

- Node type: map decision hub.
- Available entries:
  - Tailor: `/vn/lead_tailor`.
  - Apothecary: `/vn/lead_apothecary`.
  - Pub: `/vn/lead_pub`.
- Clue-to-lead payoff matrix:
  - Tailor:
    - legacy: `clue_hartmann_internal_contact`, `clue_box217_sensitive`, `clue_galdermann_preseed_confirmed`.
    - new: `clue_lock_signature`, `clue_hidden_slot`, `clue_relic_gap`.
  - Apothecary:
    - legacy: `clue_chemical_sender`, `clue_sender_residue_match`, `clue_hartmann_internal_contact`.
    - new: `clue_sleep_agent`, `clue_relic_gap`, `clue_lock_signature`.
  - Pub:
    - legacy: `rumor_night_guard`, `clue_previous_investigator`, `clue_hartmann_internal_contact`.
    - new: `clue_hidden_slot`, `clue_relic_gap`.
- Safety rule: no lead blocked by missing clue flags; clues only increase depth.

## State Delta

- Direct node delta:
  - none; map acts as routing hub.
- Indirect delta:
  - chosen lead scenario applies its own flags/evidence/unlocks.

## Transitions

- To [[10_Narrative/Scenes/node_case1_lead_tailor|Node: Case 1 Lead - Tailor]].
- To [[10_Narrative/Scenes/node_case1_lead_apothecary|Node: Case 1 Lead - Apothecary]].
- To [[10_Narrative/Scenes/node_case1_lead_pub|Node: Case 1 Lead - Pub]].

## Validation

- Confirm all 3 lead markers are actionable after bank conclusion.
- Confirm clue-conditioned lead options appear only with corresponding flags.
- Confirm all 3 leads remain playable without clue-conditioned options.
- Test anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/leads/tailor/lead_tailor.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/leads/apothecary/lead_apothecary.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/leads/pub/lead_pub.logic.ts`
