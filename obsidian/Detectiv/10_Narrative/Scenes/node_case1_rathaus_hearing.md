---
id: node_case1_rathaus_hearing
aliases:
  - Node: Case 1 Rathaus Hearing
tags:
  - type/node
  - status/proposed
  - layer/vn
  - phase/case01
  - loop/social
---

# Node: Case 1 Rathaus Hearing

## Trigger Source

- Route: `/vn/detective_case1_rathaus_hearing` (planned).
- Source node: [[10_Narrative/Scenes/node_case1_convergence_rathaus_gate|Node: Case 1 Convergence Rathaus Gate]] via `official` route.
- Planned scenario anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/01_briefing/case1_rathaus_hearing.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/01_briefing/case1_rathaus_hearing.en.ts`

## Preconditions

- Required flags:
  - `route_official_selected=true`
  - `convergence_gate_seen=true`
- Required evidence/items:
  - at least one institutional bundle indicator (`bundle_identity_ready` or `bundle_chemical_ready`).
- Required quest stage: `case01=leads_open`.
- Fallback if missing requirements:
  - reroute to [[10_Narrative/Scenes/node_case1_workers_backchannel|Node: Case 1 Workers Backchannel]].

## Named Cast

- [[30_World_Intel/Characters/char_inspector|char_inspector]] - seeks formal leverage without losing pace.
- [[30_World_Intel/Characters/char_mayor|char_mayor]] - political arbiter worried about scandal.
- [[30_World_Intel/Characters/char_clara_altenburg|char_clara_altenburg]] - allied pressure with a personal records stake.
- [[30_World_Intel/Characters/char_official|char_official]] - Dr. Emil Hegenauer, the procedural shield and opposition voice.

## Designer View

- Player intent: secure legal leverage without losing operational tempo.
- Dramatic function: complication.
- Narrative function: convert clues into administrative power under political pressure.
- Emotional tone: formal, tense, adversarial cooperation.
- Stakes: legal route can grant cleaner finale conditions but may increase visibility and political cost.

## Mechanics View

- Player verb: persuade, pressure, and cross-check contradictions against Hegenauer's shield.
- Node type: decision.
- Mechanics used:
  - branching dialogue;
  - relationship-sensitive responses;
  - mixed skill checks for warrant access.
- Skill checks:
  - Check id: `chk_case1_hearing_authority_mayor`
    - Voice id: `authority`
    - Difficulty: 10
    - On pass: `warrant_ready=true`
    - On fail: `archive_access_limited=true`
  - Check id: `chk_case1_hearing_logic_record`
    - Voice id: `logic`
    - Difficulty: 11
    - On pass: `hearing_contradiction_logged=true`
    - On fail: `hearing_contradiction_missed=true`
- Procedural resistance:
  - Hegenauer carries the immediate legal obstruction while the Mayor arbitrates political cost.
- Resources: optional social cost (`heat` or relation loss in fail branches).
- Rewards:
  - legal archive run unlocked with stronger evidence context.

## State Delta

- Flags set:
  - `rathaus_hearing_complete`
  - `warrant_ready` or `archive_access_limited`
  - optional: `hearing_contradiction_logged`
- Flags unset: none.
- Evidence gained:
  - `ev_hearing_minutes` (planned).
- Evidence lost: none.
- Quest stage changes: none.
- Map unlock/visibility changes:
  - enables archive route via [[10_Narrative/Scenes/node_case1_archive_warrant_run|Node: Case 1 Archive Warrant Run]].
- Resources (xp/money/items):
  - voice XP from checks.
- Relationship deltas:
  - mayor/clara relation may increase on controlled pressure;
  - relation penalty on confrontational failure.

## Transitions

- Success -> [[10_Narrative/Scenes/node_case1_archive_warrant_run|Node: Case 1 Archive Warrant Run]]
- Soft fail -> [[10_Narrative/Scenes/node_case1_archive_warrant_run|Node: Case 1 Archive Warrant Run]]
- Cancel -> [[10_Narrative/Scenes/node_case1_workers_backchannel|Node: Case 1 Workers Backchannel]]
- Recovery -> [[10_Narrative/Scenes/node_case1_workers_backchannel|Node: Case 1 Workers Backchannel]]

## Validation

- Test anchor:
  - planned VN route and flag outcomes in `case1_rathaus_hearing.logic.ts`.
- Done criteria:
  - hearing always yields a forward route (full warrant or limited archive access);
  - no dialogue branch hard-locks progression;
  - the opposition voice is explicit and non-placeholder.
- Checklist status:
  - [ ] Narrative_Consistency_Checklist
  - [ ] Narrative_Gameplay_Checklist
