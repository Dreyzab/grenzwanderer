---
id: node_case1_lead_pub
aliases:
  - Node: Case 1 Lead - Pub
tags:
  - type/node
  - status/active
  - layer/vn
  - phase/case01
---

# Node: Case 1 Lead - Pub

## Trigger Source

- Route: `/vn/lead_pub`.
- Source node: [[10_Narrative/Scenes/node_case1_first_lead_selection|Node: Case 1 First Lead Selection]].
- Scenario anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/leads/pub/lead_pub.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/leads/pub/lead_pub.en.ts`

## Preconditions

- Required flags: `bank_investigation_complete=true`.
- Required evidence/items: none.
- Required quest stage: `case01=leads_open`.
- Recovery route if missing requirements:
  - return to [[10_Narrative/Scenes/node_case1_first_lead_selection|Node: Case 1 First Lead Selection]].

## Named Cast

- [[30_World_Intel/Characters/char_inspector|char_inspector]] - investigator driving the social extraction.
- [[30_World_Intel/Characters/char_pub_owner|char_pub_owner]] - room controller who decides whether Gustav can be reached.
- [[30_World_Intel/Characters/char_gustav_brandt|char_gustav_brandt]] - named witness who carries the logistics testimony.
- [[30_World_Intel/Characters/char_priest|char_priest]] - optional witness-shelter fallback once Gustav talks.

## Designer View

- Dramatic function: witness extraction under social friction.
- Intent: transform rumor into route-grade logistics and transfer hints.
- Tone: rough, suspicious, pressure-driven.

## Mechanics View

- Node type: social witness branch.
- Core path:
  - approach Pub Owner -> gain access to Gustav -> charisma/authority checks -> testimony -> logistics direction.
- Optional moral stabilizer:
  - Pater Johannes can take Gustav into bounded shelter after testimony; this changes interpretation and protection tone, not route availability.
- Legacy clue-payoff branches (kept):
  - `follow_night_guard_rumor` (requires `rumor_night_guard`) -> `clue_night_guard_pub_confirmed`.
  - `ask_previous_investigator` (requires `clue_previous_investigator`) -> `clue_previous_investigator_last_seen_pub`.
  - `mention_hartmann_payments` (requires `clue_hartmann_internal_contact`) -> `clue_hartmann_cash_runner`.
- New clue-payoff branches:
  - `follow_hidden_slot_route` (requires `clue_hidden_slot`) -> `clue_scaffold_hidden_entry`.
  - `ask_relic_transfer` (requires `clue_relic_gap`) -> `clue_relic_transfer_rumor`.
  - `ask_relic_transfer_books` (requires `clue_relic_gap`) -> corroborates `clue_relic_transfer_rumor`.
- Checks:
  - `chk_pub_charisma_gustav` (`charisma` DC 8).
  - `chk_pub_authority_gustav` (`authority` DC 12).
- Safety rule: failed checks loop back; no hard fail.

## State Delta

- Flags set:
  - `pub_checked_hidden_slot`
  - `clue_scaffold_hidden_entry`
  - `pub_asked_night_guard`
  - `clue_night_guard_pub_confirmed`
  - `gustav_asked_hartmann`
  - `clue_hartmann_cash_runner`
  - `gustav_asked_relic_transfer`
  - `clue_relic_transfer_rumor`
  - `barkeep_relic_transfer_asked`
  - `barkeep_prev_investigator_asked`
  - `clue_previous_investigator_last_seen_pub`
  - `gustav_talked`
  - `heard_warehouse_rumor` (eavesdrop branch)
  - `pub_lead_complete`
- Evidence gained:
  - `ev_shadow_witness`.
- Map unlock/visibility changes:
  - unlock `loc_telephone`.
- Quest stage changes:
  - none in this node.

## Transitions

- Success path: END -> map with follow-up channels available.
- Fail/soft-fail path: charisma/authority fail returns to interaction loop.
- Cancel path: leave loops or END -> map.

## Validation

- Confirm new clue-gated options appear only when corresponding flags exist.
- Confirm Gustav Brandt testimony remains reachable by at least one success route.
- Confirm END sets `pub_lead_complete` and unlocks `loc_telephone`.
- Test anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/leads/pub/lead_pub.logic.ts`
