---
id: node_case1_convergence_rathaus_gate
aliases:
  - Node: Case 1 Convergence Rathaus Gate
tags:
  - type/node
  - status/proposed
  - layer/map
  - phase/case01
  - loop/investigation
---

# Node: Case 1 Convergence Rathaus Gate

## Trigger Source

- Route: `/map`.
- Source node: [[10_Narrative/Scenes/node_case1_first_lead_selection|Node: Case 1 First Lead Selection]].
- Entry action: player clicks `loc_rathaus` after opening lead routes.
- Planned code anchors:
  - `apps/server/src/scripts/data/case_01_points.ts` (Rathaus gate binding).
  - `apps/web/src/widgets/map/map-view/MapView.tsx` (binding execution and scenario start).

## Preconditions

- Required flags:
  - `case01` at `leads_open`.
  - At least two bundle readiness flags:
    - `bundle_identity_ready`
    - `bundle_logistics_ready`
    - `bundle_chemical_ready`
- Required evidence/items: none.
- Required quest stage: `case01=leads_open`.
- Fallback if missing requirements:
  - return to [[10_Narrative/Scenes/node_case1_first_lead_selection|Node: Case 1 First Lead Selection]] with objective hint for the missing bundle.

## Designer View

- Player intent: convert scattered lead results into a strategic route choice.
- Dramatic function: decision.
- Narrative function: force commitment to official pressure or covert pressure.
- Emotional tone: control under pressure, narrowing options, irreversible momentum.
- Stakes: route choice changes cost profile (relationships, risk exposure, and finale tone).

## Mechanics View

- Player verb: synthesize evidence and commit to route.
- Node type: decision.
- Mechanics used:
  - map gate condition evaluation;
  - branch choice (`official` vs `covert`);
  - objective fallback when gate not satisfied.
- Skill checks: none required in gate selection itself.
- Resources: none.
- Rewards:
  - unlocks next route node and route-specific objectives.

## State Delta

- Flags set:
  - `convergence_gate_seen`
  - `route_official_selected` or `route_covert_selected`
  - optional fallback flag: `missing_bundle_hint_issued`
- Flags unset:
  - `route_official_selected` when covert is picked
  - `route_covert_selected` when official is picked
- Evidence gained: none.
- Evidence lost: none.
- Quest stage changes: none.
- Map unlock/visibility changes:
  - enables route-specific action on `loc_rathaus` or `loc_workers_pub`.
- Resources (xp/money/items): none.
- Relationship deltas: none.

## Transitions

- Success (official) -> [[10_Narrative/Scenes/node_case1_rathaus_hearing|Node: Case 1 Rathaus Hearing]]
- Success (covert) -> [[10_Narrative/Scenes/node_case1_workers_backchannel|Node: Case 1 Workers Backchannel]]
- Soft fail -> [[10_Narrative/Scenes/node_case1_first_lead_selection|Node: Case 1 First Lead Selection]]
- Cancel -> [[10_Narrative/Scenes/node_case1_first_lead_selection|Node: Case 1 First Lead Selection]]
- Recovery -> [[10_Narrative/Scenes/node_case1_first_lead_selection|Node: Case 1 First Lead Selection]]

## Validation

- Test anchor:
  - future map binding test for route selection gating in `case_01_points.ts`.
- Done criteria:
  - gate offers route choice only when 2 of 3 bundles are present;
  - fallback path preserves forward momentum and does not hard-lock.
- Checklist status:
  - [ ] Narrative_Consistency_Checklist
  - [ ] Narrative_Gameplay_Checklist
