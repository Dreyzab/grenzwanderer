---
id: node_dead_registry_archive
aliases:
  - Node: Dead Registry Archive
tags:
  - type/node
  - status/proposed
  - layer/vn
  - phase/case01
  - loop/investigation
---

# Node: Dead Registry Archive

## Trigger Source

- Planned route: `/vn/detective_dead_registry_archive`.
- Suggested map source: [[00_Map_Room/loc_freiburg_archive|loc_freiburg_archive]] after Agency briefing.
- Planned scenario anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/dead_registry/01_archive/dead_registry_archive.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/dead_registry/01_archive/dead_registry_archive.en.ts`

## Preconditions

- Required flags:
  - `dead_registry_started=true`
  - `dead_registry_archive_complete=false`
- Required evidence/items: none.
- Required quest stage: `dead_registry=briefing` preferred.
- Fallback if missing requirements:
  - return to [[10_Narrative/Scenes/node_dead_registry_briefing|Node: Dead Registry Briefing]].

## Named Cast

- [[30_World_Intel/Characters/char_inspector|char_inspector]] - compares three administrative systems that should not disagree this cleanly.
- [[30_World_Intel/Characters/char_archive_keeper|char_archive_keeper]] - permits supervised access while hiding which cards were pulled first.
- [[30_World_Intel/Characters/char_official|char_official]] - narrows the legal frame and quietly prefers the case to die in process.

## Designer View

- Player intent: turn rumor into documentary contradiction.
- Dramatic function: paper-trail confirmation.
- Narrative function: establish that the city does not merely lose people; it classifies them twice.
- Emotional tone: cold, methodical, and increasingly uncanny through precision rather than spectacle.
- Stakes: the chemist thread appears as a documented anomaly, not a rumor.

## Mechanics View

- Node type: document-comparison investigation hub.
- Core tasks:
  - compare death registry entries;
  - compare parish transfer and burial numbering;
  - compare school payroll reinstatement marks.
- Suggested checks:
  - `chk_dead_registry_archive_logic` (`logic`, diff 9) -> timeline contradiction surfaces early.
  - `chk_dead_registry_archive_encyclopedia` (`encyclopedia`, diff 10) -> recognizes secondary numbering practice.
  - `chk_dead_registry_archive_tradition` (`tradition`, diff 9) -> spots burial protocol mismatch.
- Fail-forward rule:
  - weak results still expose the chemistry master as a document anomaly;
  - strong results reveal the redacted service leave and precise duplicate burial index.

## State Delta

- Flags set:
  - `dead_registry_archive_complete`
  - `dead_registry_field_fork_open`
- Clues gained:
  - `clue_double_burial_number`
  - optional strong-result clue: `clue_redacted_service_leave`
- Rumors:
  - register `rumor_returned_chemist`
- Quest stage changes:
  - `dead_registry=paper_trail`
- Map unlock/visibility changes:
  - recommend follow-up at [[30_World_Intel/Locations/Loc_Munster|loc_munster]]
  - recommend follow-up at [[30_World_Intel/Locations/Loc_Freiburg_Lyceum|loc_lyceum]]

## Transitions

- To [[10_Narrative/Scenes/node_dead_registry_infirmary|Node: Dead Registry Infirmary]]
- To [[10_Narrative/Scenes/node_dead_registry_lyceum|Node: Dead Registry Lyceum]]
- To [[10_Narrative/Scenes/node_dead_registry_grave_or_parish|Node: Dead Registry Grave or Parish]]

## Validation

- Archive route must establish a genuine pattern, not a one-off clerical mistake.
- The chemistry master must read as plausible, not convicted.
- Any failed check must still leave at least two follow-up routes open.
- Checklist status:
  - [ ] Narrative_Gameplay_Checklist
