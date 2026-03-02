---
id: gameplay_story_board
tags:
  - type/moc
  - domain/narrative
  - domain/game_design
  - status/active
aliases:
  - Gameplay Story Board
---

# Gameplay Story Board

## Purpose

Single production board for runtime-accurate narrative and gameplay flow.

## Governance

- Protocol: [[99_System/Narrative_Gameplay_Protocol|Narrative Gameplay Protocol]]
- Checklist: [[99_System/Narrative_Gameplay_Checklist|Narrative Gameplay Checklist]]
- Pacing rules: [[99_System/Narrative_Pacing_Rules|Narrative Pacing Rules]]

## Forward Plot Graph (Design)

- [[00_Map_Room/Story_Graph_Case01_Forward_Arc|Story Graph: Case 01 Forward Arc]]
- [[40_GameViewer/MOC_GameViewer|GameViewer Perspective]]
- [[00_Map_Room/Mechanics_Rollout_Case01|Mechanics Rollout: Case 01]]

## Active Start Chain (Case 01)

1. [[10_Narrative/Scenes/node_start_game_new_investigation|Node: Start Game - New Investigation]]
2. [[10_Narrative/Scenes/node_intro_char_creation|Node: Intro Character Creation]]
3. [[10_Narrative/Scenes/node_telegram_gate_after_creation|Node: Telegram Gate After Creation]]
4. [[10_Narrative/Scenes/node_case1_hbf_arrival|Node: Case 1 HBF Arrival]]
5. [[10_Narrative/Scenes/node_case1_alt_briefing_entry|Node: Case 1 Alt Briefing Entry]]
6. [[10_Narrative/Scenes/node_case1_map_first_exploration|Node: Case 1 Map First Exploration]]
7. [[10_Narrative/Scenes/node_case1_qr_scan_bank|Node: Case 1 QR Scan Bank]]
8. [[10_Narrative/Scenes/node_case1_bank_investigation|Node: Case 1 Bank Investigation]]
9. [[10_Narrative/Scenes/node_case1_first_lead_selection|Node: Case 1 First Lead Selection]]

## Forward Arc Chain (Case 01, Proposed)

1. [[10_Narrative/Scenes/node_case1_convergence_rathaus_gate|Node: Case 1 Convergence Rathaus Gate]]
2. [[10_Narrative/Scenes/node_case1_rathaus_hearing|Node: Case 1 Rathaus Hearing]] or [[10_Narrative/Scenes/node_case1_workers_backchannel|Node: Case 1 Workers Backchannel]]
3. [[10_Narrative/Scenes/node_case1_archive_warrant_run|Node: Case 1 Archive Warrant Run]] or [[10_Narrative/Scenes/node_case1_rail_yard_shadow_tail|Node: Case 1 Rail Yard Shadow Tail]]
4. [[10_Narrative/Scenes/node_case1_warehouse_entry_plan|Node: Case 1 Warehouse Entry Plan]]
5. [[10_Narrative/Scenes/node_case1_finale_resolution_split|Node: Case 1 Finale Resolution Split]]

## Current Production Slice (Option A Runtime)

1. Complete all three lead nodes (tailor/apothecary/pub).
2. Trigger [[10_Narrative/Scenes/node_case1_lotte_interlude_warning|Node: Case 1 Lotte Interlude Warning]] after any 2 of 3 lead completions via `loc_telephone`.
3. Resolve [[10_Narrative/Scenes/node_case1_archive_warrant_run|Node: Case 1 Archive Warrant Run]] via `loc_freiburg_archive` (3 archive checks, fail-forward).
4. Unlock warehouse route only after archive packet completion (`archive_casefile_complete=true`).

## Optional / Legacy Paths

- Optional origin branch:
  - [[10_Narrative/Scenes/node_intro_journalist_origin|Node: Intro Journalist Origin]]
- Lead nodes:
  - [[10_Narrative/Scenes/node_case1_lead_tailor|Node: Case 1 Lead - Tailor]]
  - [[10_Narrative/Scenes/node_case1_lead_apothecary|Node: Case 1 Lead - Apothecary]]
  - [[10_Narrative/Scenes/node_case1_lead_pub|Node: Case 1 Lead - Pub]]

## Runtime Notes (Current Implementation)

- HBF onboarding is a full VN scenario (`/vn/detective_case1_hbf_arrival`).
- Map exploration intro auto-starts once after alt briefing (`case01_map_exploration_intro_done`).
- QR gate remains fail-forward and deterministic into bank investigation.
- Bank investigation is now triage + forensics + reconstruction with compatibility gate (`clerk_interviewed && vault_inspected`).
- Reveal policy in bank scene: late ambiguity (no hard supernatural confirmation).

## Progressive Mechanics Sequence (Recommended)

1. Archive + Lotte interlude (Option A)
2. Map events and encounters (Option D)
3. Poetry duel side content (Option B)
4. Warehouse battle capstone (Option C)

## Flow Pattern (Reusable)

`Map visibility -> movement/context -> gate -> VN investigation -> lead unlock -> map`

## Clue Seeding Pattern (Onboarding -> Bank -> Leads)

- Legacy continuity:
  - `Galdermann`: HBF/map seeds -> manager confrontation branch.
  - `Hartmann`: newspaper/letter seeds -> manager/clerk pressure branches.
  - `Box 217`: map seed -> clerk question -> tailor payoff.
  - `Chemical sender`: map seed -> vault compare -> apothecary crosscheck.
- New bank clue layer:
  - `clue_sleep_agent`: triage/forensics/reconstruction -> apothecary sedation branch.
  - `clue_lock_signature`: vault forensics -> tailor/apothecary technical branches.
  - `clue_relic_gap`: manager + vault + reconstruction -> all leads (transfer motive).
  - `clue_hidden_slot`: triage/reconstruction/occult -> tailor/pub logistics branches.

## Legacy Paths (Kept for Testing)

- [[10_Narrative/Scenes/node_map_action_bank_crime_scene|Node: Map Action - Bank Crime Scene]]

## Rules

- Every runtime flow change must update linked node notes in same cycle.
- Every node must keep full contract sections (Trigger, Preconditions, Designer, Mechanics, State Delta, Transitions, Validation).
- No critical-path hard fail without a recovery route.
