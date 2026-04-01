---
id: node_case1_bank_investigation
aliases:
  - Node: Case 1 Bank Investigation
tags:
  - type/node
  - status/active
  - layer/vn
  - phase/case01
---

# Node: Case 1 Bank Investigation

## Trigger Source

- Route: `/vn/detective_case1_bank_scene`.
- Source node: [[10_Narrative/Scenes/node_case1_qr_scan_bank|Node: Case 1 QR Scan Bank]].
- Scenario anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/02_bank/case1_bank.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/02_bank/case1_bank.en.ts`

## Preconditions

- Required flags:
  - `qr_scanned_bank=true`.
- Required evidence/items: none.
- Required quest stage:
  - `case01` at `bank_investigation` (set by QR gate success).
- Recovery route if missing requirements:
  - return to [[10_Narrative/Scenes/node_case1_qr_scan_bank|Node: Case 1 QR Scan Bank]].

## Named Cast

- [[30_World_Intel/Characters/char_inspector|char_inspector]] - lead investigator.
- [[30_World_Intel/Characters/char_bank_manager|char_bank_manager]] - sponsor-facing client and principal suspect.
- [[30_World_Intel/Characters/char_clerk|char_clerk]] - frightened internal witness.
- [[30_World_Intel/Characters/char_clara_altenburg|char_clara_altenburg]] - civic pressure and family-record motive.
- [[30_World_Intel/Characters/char_assistant|char_assistant]] - technical corroboration through Victoria Sterling.
- [[30_World_Intel/Characters/char_coroner|char_coroner]] - medical skepticism and body-state framing.
- [[30_World_Intel/Characters/char_stationmaster|char_stationmaster]] - logistics cross-check at the rail edge.
- [[30_World_Intel/Characters/char_priest|char_priest]] - Chapter of Mercy referral and witness-shelter contact.

## Designer View

- Dramatic function: reveal hub with layered ambiguity.
- Intent: reframe robbery as staged cover while preserving procedural uncertainty.
- Tone: controlled panic, institutional resistance, selective truth.
- Reveal policy: late ambiguity (no hard supernatural confirmation in this node).

## Mechanics View

- Node type: hub + branching investigation.
- Core branches required to conclude:
  - triage branch (`clerk_interviewed`).
  - forensic vault branch (`vault_inspected`).
- Optional depth branch:
  - reconstruction branch (`bank_reconstruction_done`) for stronger downstream payoff.
- Hub branches:
  - `speak_manager` (pressure + denials).
  - `triage_witnesses` (symptoms + witness reliability).
  - `inspect_vault_forensics` (breach method + extraction pattern).
  - `run_reconstruction` (imagination/logic/empathy synthesis).
- Supporting social frame:
  - triage aftermath can invoke Pater Johannes as witness-shelter context; this adds moral framing and bounded testimony, not a new route gate.
- Skill checks:
  - `empathy` (clerk fear read).
  - `logic` (sleep-wave analysis, lock analysis, sender-chain compare, timeline pressure).
  - `intuition` (atmosphere trace).
  - `imagination` (relic extraction pattern and entry-vector reconstruction).
  - optional `occultism` for symbolic-layer read.
- Passive voice moments:
  - `senses`, `volition`, `perception` in triage/forensics/reconstruction entry scenes.
- Clue-seeding integration:
  - onboarding seeds still drive Hartmann/Box217/Galdermann branches.
  - new internal clue layer:
    - `clue_sleep_agent`
    - `clue_lock_signature`
    - `clue_relic_gap`
    - `clue_hidden_slot`
- Safety rule: no hard fail dead-end; all failures reroute to active hub loops.

## State Delta

- Flags set (core compatibility):
  - `met_galdermann`
  - `clerk_interviewed`
  - `vault_inspected`
  - `bank_investigation_complete`
- Flags set (legacy seeded outcomes):
  - `clue_galdermann_preseed_confirmed`
  - `clue_hartmann_brushed_off`
  - `asked_hartmann`
  - `clue_hartmann_internal_contact`
  - `asked_box_217`
  - `clue_box217_sensitive`
  - `compared_sender_residue`
  - `clue_sender_residue_match` (logic success only)
  - `found_velvet`
  - `found_residue`
- Flags set (new layer):
  - `clue_sleep_agent`
  - `clue_lock_signature`
  - `clue_relic_gap`
  - `clue_hidden_slot`
  - `bank_reconstruction_done`
- Evidence gained (branch-dependent):
  - `ev_witness_rumor`
  - `ev_sleep_agent_profile`
  - `ev_torn_velvet`
  - `ev_lock_signature_report`
  - `ev_chemical_residue`
  - `ev_relic_inventory_gap`
  - optional `ev_occult_circle`
- Quest stage changes:
  - `case01` -> `leads_open` on conclusion.
- Map unlock/visibility changes:
  - unlock `loc_tailor`, `loc_apothecary`, `loc_pub`.
- Resources:
  - voice XP via passive and active checks.
- Relationship deltas:
  - Clara deltas may occur in intro reactions.

## Transitions

- Success path: conclude investigation -> [[10_Narrative/Scenes/node_case1_first_lead_selection|Node: Case 1 First Lead Selection]].
- Fail/soft-fail path: all failed checks return to loops while preserving progression toward conclusion gate.
- Cancel/exit path: leaving VN keeps map progression recoverable through bank marker.

## Validation

- Confirm conclusion still requires both `clerk_interviewed` and `vault_inspected`.
- Confirm no check failure blocks node completion.
- Confirm `compare_chemical_sender` appears only with `clue_chemical_sender` and resolves once.
- Confirm new clue flags can be produced through branch actions or token interaction.
- Confirm the Chapter of Mercy is represented through Pater Johannes as witness-shelter context before later route splits.
- Confirm conclusion still unlocks 3 lead points and sets `case01` to `leads_open`.
- Test anchor:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/02_bank/case1_bank.logic.ts`
