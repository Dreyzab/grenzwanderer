---
id: node_case1_workers_backchannel
aliases:
  - Node: Case 1 Workers Backchannel
tags:
  - type/node
  - status/proposed
  - layer/vn
  - phase/case01
  - loop/social
---

# Node: Case 1 Workers Backchannel

## Trigger Source

- Route: `/vn/detective_case1_workers_backchannel` (planned).
- Source node: [[10_Narrative/Scenes/node_case1_convergence_rathaus_gate|Node: Case 1 Convergence Rathaus Gate]] via `covert` route.
- Planned scenario anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/leads/pub/case1_workers_backchannel.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/leads/pub/case1_workers_backchannel.en.ts`

## Preconditions

- Required flags:
  - `route_covert_selected=true`
  - `convergence_gate_seen=true`
- Required evidence/items:
  - at least one logistics indicator (`bundle_logistics_ready=true` preferred).
- Required quest stage: `case01=leads_open`.
- Fallback if missing requirements:
  - reroute to [[10_Narrative/Scenes/node_case1_rathaus_hearing|Node: Case 1 Rathaus Hearing]].

## Designer View

- Player intent: obtain hidden access without institutional approval.
- Dramatic function: complication.
- Narrative function: shift investigation from formal authority to underground leverage.
- Emotional tone: paranoid, transactional, unstable trust.
- Stakes: covert path is faster but riskier and more expensive in social capital.

## Mechanics View

- Player verb: negotiate, bluff, and secure shadow cooperation.
- Node type: decision.
- Mechanics used:
  - social branch dialogue with faction gate;
  - optional bribe branch;
  - risk-sensitive route unlock.
- Skill checks:
  - Check id: `chk_case1_backchannel_charisma`
    - Voice id: `charisma`
    - Difficulty: 9
    - On pass: `covert_entry_ready=true`
    - On fail: `backchannel_price_up=true`
  - Check id: `chk_case1_backchannel_deception`
    - Voice id: `deception`
    - Difficulty: 10
    - On pass: `shadow_contact_trusted=true`
    - On fail: `shadow_contact_suspicious=true`
- Resources:
  - possible money/bribe spend on failed persuasion path.
- Rewards:
  - unlocks rail yard tail path with covert entry setup.

## State Delta

- Flags set:
  - `workers_backchannel_complete`
  - `covert_entry_ready` or `backchannel_price_up`
  - optional: `shadow_contact_trusted`
- Flags unset: none.
- Evidence gained:
  - `ev_backchannel_contact_note` (planned).
- Evidence lost: none.
- Quest stage changes: none.
- Map unlock/visibility changes:
  - enables [[10_Narrative/Scenes/node_case1_rail_yard_shadow_tail|Node: Case 1 Rail Yard Shadow Tail]].
- Resources (xp/money/items):
  - charisma/deception XP;
  - optional money spend in fallback branch.
- Relationship deltas:
  - relation shifts with civic and worker factions based on method.

## Transitions

- Success -> [[10_Narrative/Scenes/node_case1_rail_yard_shadow_tail|Node: Case 1 Rail Yard Shadow Tail]]
- Soft fail -> [[10_Narrative/Scenes/node_case1_rail_yard_shadow_tail|Node: Case 1 Rail Yard Shadow Tail]]
- Cancel -> [[10_Narrative/Scenes/node_case1_rathaus_hearing|Node: Case 1 Rathaus Hearing]]
- Recovery -> [[10_Narrative/Scenes/node_case1_rathaus_hearing|Node: Case 1 Rathaus Hearing]]

## Validation

- Test anchor:
  - planned branch outcome tests in `case1_workers_backchannel.logic.ts`.
- Done criteria:
  - covert route always progresses to rail yard path;
  - failed persuasion converts into cost, never dead-end.
- Checklist status:
  - [ ] Narrative_Consistency_Checklist
  - [ ] Narrative_Gameplay_Checklist
