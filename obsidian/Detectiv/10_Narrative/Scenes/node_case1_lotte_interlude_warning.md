---
id: node_case1_lotte_interlude_warning
aliases:
  - Node: Case 1 Lotte Interlude Warning
tags:
  - type/node
  - status/active
  - layer/vn
  - phase/case01
  - loop/companion
---

# Node: Case 1 Lotte Interlude Warning

## Trigger Source

- Runtime route: `/vn/interlude_lotte_warning`.
- Map source: `loc_telephone` in `apps/server/src/scripts/data/case_01_points.ts`.
- Trigger condition: any 2 of 3 lead completions (`tailor_lead_complete`, `apothecary_lead_complete`, `pub_lead_complete`) and `lotte_interlude_complete=false`.
- Runtime anchor:
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/lotte_wires/interlude_lotte.logic.ts`

## Preconditions

- Required map/state conditions:
  - `lotte_interlude_complete=false`
  - at least two lead completion flags are true.
- No required quest stage gate.
- Safety fallback:
  - if trigger conditions are not met, mainline remains playable through lead/archive nodes.

## Designer View

- Player intent: assess whether to trust Lotte as an off-book informant.
- Dramatic function: inject surveillance pressure and companion tension.
- Narrative function: bridge main investigation and telegraph side channel.
- Emotional tone: covert, urgent, and politically risky.
- Stakes: tone of relationship with Lotte shifts future collaboration framing.

## Mechanics View

- Node type: short overlay interlude.
- Choice branch:
  - personal trust response (`thank_personal`)
  - formal distance response (`dismiss_professional`)
- Systems touched:
  - relationship delta (`operator`)
  - progression flags for companion availability.
- Follow-up hook:
  - unlocks side-quest entry state for `quest_lotte_wires` via map conditions.

## State Delta

- Always on completion:
  - `lotte_interlude_complete=true`
  - `lotte_quest_available=true`
  - `lotte_companion_introduced=true`
- Branch-specific:
  - trust route: `lotte_warning_heeded=true`, positive relationship delta.
  - distance route: `lotte_warning_heeded=false`, negative relationship delta.
- No quest-stage mutation.

## Transitions

- End -> return to map loop.
- Next optional branch -> `quest_lotte_wires` (telegraph side quest) through `loc_telephone` map binding.
- Mainline compatibility:
  - does not block archive or warehouse progression.

## Validation

- Runtime validation:
  - interlude appears only after 2/3 leads complete.
  - interlude does not repeat once `lotte_interlude_complete=true`.
  - side-quest binding appears after interlude and before `lotte_quest_complete=true`.
- Done criteria:
  - [x] Includes required node contract sections.
  - [x] No hard-fail critical path.
  - [x] Map trigger and VN flags synced in one implementation cycle.
- Checklist status:
  - [x] Narrative_Gameplay_Protocol reviewed.
  - [x] Narrative_Gameplay_Checklist constraints applied.
