---
id: node_dead_registry_briefing
aliases:
  - Node: Dead Registry Briefing
tags:
  - type/node
  - status/proposed
  - layer/vn
  - phase/case01
  - loop/bureau
---

# Node: Dead Registry Briefing

## Trigger Source

- Planned route: `/vn/detective_dead_registry_briefing`.
- Suggested map source: [[00_Map_Room/loc_agency|loc_agency]].
- Narrative source: first Agency return after [[10_Narrative/Scenes/node_case1_bank_investigation|Node: Case 1 Bank Investigation]].
- Planned scenario anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/dead_registry/00_briefing/dead_registry_briefing.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/dead_registry/00_briefing/dead_registry_briefing.en.ts`

## Preconditions

- Required flags:
  - `agency_briefing_complete=true`
  - `bank_investigation_complete=true`
  - `dead_registry_started=false`
- Required evidence/items: none.
- Required quest stage: parallel-to-mainline availability only.
- Fallback if missing requirements:
  - return to [[10_Narrative/Scenes/node_case1_first_lead_selection|Node: Case 1 First Lead Selection]] or normal agency hub loop.

## Named Cast

- [[30_World_Intel/Characters/char_inspector|char_inspector]] - receives the file as an administrative nuisance that is obviously not one.
- Lotte Weber - frames the case as cleanup while signaling that the Agency has seen this pattern before.
- Off-stage pressure: [[30_World_Intel/Characters/char_official|char_official]] wants the discrepancy handled quietly.

## Designer View

- Player intent: understand why the Agency interrupts the bank line with civic records work.
- Dramatic function: parallel-case ignition.
- Narrative function: reframe the bank anomaly as part of a wider civic pattern.
- Emotional tone: clipped, procedural, and faintly dishonest.
- Stakes: the bureau wants a pattern, not a scandal.

## Mechanics View

- Node type: briefing decision node.
- Core beats:
  - accept the file cleanly;
  - press Weber on why the Agency cares;
  - ask what the Chancellery already knows.
- Suggested checks:
  - `chk_dead_registry_briefing_logic` (`logic`, diff 9) -> detects this is not the first such file.
  - `chk_dead_registry_briefing_empathy` (`empathy`, diff 8) -> reads that Weber is protecting living witnesses, not paper.
- Rewards:
  - starts the quest;
  - registers first rumor;
  - routes player toward archive comparison without blocking bank lead choice.

## State Delta

- Flags set:
  - `dead_registry_started`
  - `dead_registry_briefing_complete`
- Rumors:
  - register `rumor_dead_registry_duplicates`
- Quest stage changes:
  - `dead_registry=briefing`
- Map unlock/visibility changes:
  - none required; archive remains the recommended next anchor.

## Transitions

- Success -> [[10_Narrative/Scenes/node_dead_registry_archive|Node: Dead Registry Archive]]
- Exit -> return to map with archive follow-up visible through quest framing
- Recovery -> normal Case 01 lead loop remains available

## Validation

- Dead Registry must open as a real parallel investigation, not as flavor-only service text.
- The node must imply prior Agency knowledge without giving away the hidden registry outright.
- Mainline bank progression must remain playable immediately after briefing.
- Checklist status:
  - [ ] Narrative_Gameplay_Checklist
