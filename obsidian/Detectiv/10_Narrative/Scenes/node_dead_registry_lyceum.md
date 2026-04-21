---
id: node_dead_registry_lyceum
aliases:
  - Node: Dead Registry Lyceum
tags:
  - type/node
  - status/proposed
  - layer/vn
  - phase/case01
  - loop/investigation
---

# Node: Dead Registry Lyceum

## Trigger Source

- Planned route: `/vn/detective_dead_registry_lyceum`.
- Suggested map source: [[30_World_Intel/Locations/Loc_Freiburg_Lyceum|loc_lyceum]] after archive confirmation.
- Planned scenario anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/dead_registry/02_lyceum/dead_registry_lyceum.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/dead_registry/02_lyceum/dead_registry_lyceum.en.ts`

## Preconditions

- Required flags:
  - `dead_registry_archive_complete=true`
  - `dead_registry_lyceum_complete=false`
- Required evidence/items:
  - `rumor_returned_chemist` preferred.
- Required quest stage: `dead_registry=paper_trail` preferred.
- Fallback if missing requirements:
  - return to [[10_Narrative/Scenes/node_dead_registry_archive|Node: Dead Registry Archive]].

## Named Cast

- [[30_World_Intel/Characters/char_inspector|char_inspector]] - treats the classroom as a material witness.
- [[30_World_Intel/Characters/char_chemist_teacher|char_chemist_teacher]] - living contradiction inside a proper school salary book.
- Off-stage pressure: school administration prefers payroll regularity over truth.

## Designer View

- Player intent: test whether the returned chemist connects materially to the bank line.
- Dramatic function: material bridge to main case.
- Narrative function: introduce thermite knowledge, military notation, and technical plausibility without turning the chemist into an exposed culprit.
- Emotional tone: dry, precise, and strained by routine.
- Stakes: this route can sharpen the bank mystery or ruin a potentially vital source.

## Mechanics View

- Node type: interview plus classroom search.
- Core beats:
  - inspect lecture margins and reagent labels;
  - press the chemist on missing service years;
  - decide whether to treat him as suspect, source, or wounded functionary.
- Suggested checks:
  - `chk_dead_registry_lyceum_senses` (`senses`, diff 9) -> reagent heat pattern and scorched drawer trace.
  - `chk_dead_registry_lyceum_logic` (`logic`, diff 10) -> recognize military-style notation in teaching notes.
- Fail-forward rule:
  - even on failed pressure, lecture pages imply high-temperature breach expertise;
  - stronger outcomes keep the chemist available as a protected source.

## State Delta

- Flags set:
  - `dead_registry_lyceum_complete`
  - optional: `dead_registry_chemist_source_open`
- Clues gained:
  - `clue_thermite_lecture_notes`
- Rumors:
  - register `rumor_bank_thermite_teacher`
- Quest stage changes:
  - `dead_registry=field_fork`

## Transitions

- To [[10_Narrative/Scenes/node_dead_registry_grave_or_parish|Node: Dead Registry Grave or Parish]]
- Return to map for Mercy route without losing chemistry thread

## Validation

- The chemistry clue must remain bank-adjacent, not bank-conclusive.
- The chemist should be readable as both suspect and damaged witness.
- School routine should heighten unease rather than provide spectacle.
- Checklist status:
  - [ ] Narrative_Gameplay_Checklist
