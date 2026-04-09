---
id: node_dead_registry_grave_or_parish
aliases:
  - Node: Dead Registry Grave or Parish
tags:
  - type/node
  - status/proposed
  - layer/vn
  - phase/case01
  - loop/social
---

# Node: Dead Registry Grave or Parish

## Trigger Source

- Planned route: `/vn/detective_dead_registry_grave_or_parish`.
- Suggested map source: [[30_World_Intel/Locations/Loc_Munster|loc_munster]] after archive plus one field-route completion.
- Planned scenario anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/dead_registry/03_parish/dead_registry_grave_or_parish.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/dead_registry/03_parish/dead_registry_grave_or_parish.en.ts`

## Preconditions

- Required flags:
  - `dead_registry_archive_complete=true`
  - any of:
    - `dead_registry_infirmary_complete=true`
    - `dead_registry_lyceum_complete=true`
- Required evidence/items:
  - `clue_double_burial_number`
- Required quest stage: `dead_registry=field_fork` preferred.
- Fallback if missing requirements:
  - complete Mercy or Lyceum follow-up first.

## Named Cast

- [[30_World_Intel/Characters/char_inspector|char_inspector]] - forces the city to reconcile a grave, a payroll entry, and a breathing witness.
- [[30_World_Intel/Characters/char_priest|char_priest]] - guards burial records and the moral frame.
- [[30_World_Intel/Characters/char_chemist_teacher|char_chemist_teacher]] - the living witness whose official death no one wants to explain cleanly.

## Designer View

- Player intent: decide whether the chemistry master is a ghost story, an administrative fabrication, or a damaged man the city re-entered under seal.
- Dramatic function: witness pressure and interpretation crisis.
- Narrative function: move the quest from abstract registers to status-of-existence testimony.
- Emotional tone: grave, intimate, and destabilizing without hard supernatural confirmation.
- Stakes: how hard the player presses determines whether the witness can survive as a source.

## Mechanics View

- Node type: confrontation and bounded testimony.
- Core beats:
  - compare burial index against parish ledger;
  - confront the chemist with reinstatement language;
  - choose whether to demand formal confession or protected testimony.
- Suggested checks:
  - `chk_dead_registry_parish_tradition` (`tradition`, diff 10) -> burial procedure contradiction.
  - `chk_dead_registry_parish_authority` (`authority`, diff 9) -> hard testimony but higher witness risk.
  - `chk_dead_registry_parish_empathy` (`empathy`, diff 9) -> protected statement and cleaner witness preservation.
- Key line target:
  - the witness should frame his status in civic, not mystical, language: the city wrote him back in incompletely.

## State Delta

- Flags set:
  - `dead_registry_witness_pressure_complete`
  - optional: `dead_registry_chemist_protected`
  - optional: `preserved_returned_witness`
- Quest stage changes:
  - `dead_registry=witness_pressure`
- Relationship deltas:
  - Mercy-safe route strengthens `chapter_of_mercy`
  - coercive route strengthens procedural leverage while worsening witness stability

## Transitions

- To [[10_Narrative/Scenes/node_dead_registry_shadow_ledger|Node: Dead Registry Shadow Ledger]]
- Recovery -> return to Lyceum or Mercy route for missing context if confrontation stays partial

## Validation

- By node exit, player should understand the civic horror clearly while still retaining a rational explanation.
- The witness must not collapse into a direct Eden exposition dump.
- Protecting the witness must matter mechanically in the resolution node.
- Checklist status:
  - [ ] Narrative_Gameplay_Checklist
