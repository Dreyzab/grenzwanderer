---
id: node_dead_registry_infirmary
aliases:
  - Node: Dead Registry Infirmary
tags:
  - type/node
  - status/proposed
  - layer/vn
  - phase/case01
  - loop/social
---

# Node: Dead Registry Infirmary

## Trigger Source

- Planned route: `/vn/detective_dead_registry_infirmary`.
- Suggested map source: [[30_World_Intel/Locations/Loc_Munster|loc_munster]] via Chapter of Mercy shelter access.
- Planned scenario anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/dead_registry/02_mercy/dead_registry_infirmary.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/dead_registry/02_mercy/dead_registry_infirmary.en.ts`

## Preconditions

- Required flags:
  - `dead_registry_archive_complete=true`
  - `dead_registry_infirmary_complete=false`
- Required evidence/items:
  - `clue_double_burial_number` preferred but not hard-required.
- Required quest stage: `dead_registry=paper_trail` preferred.
- Fallback if missing requirements:
  - return to [[10_Narrative/Scenes/node_dead_registry_archive|Node: Dead Registry Archive]].

## Named Cast

- [[30_World_Intel/Characters/char_inspector|char_inspector]] - needs bodily evidence that is still human-scale and not theatrical horror.
- [[30_World_Intel/Characters/char_priest|char_priest]] - controls witness dignity and access.
- Mercy shelter witnesses - survivors whose records and bodies do not align cleanly.

## Designer View

- Player intent: learn whether the paper anomaly corresponds to living trauma.
- Dramatic function: humanization and tonal deepening.
- Narrative function: prove that the returned are not monsters first, but damaged citizens under quiet containment.
- Emotional tone: intimate, exhausted, and morally uncomfortable.
- Stakes: careless handling burns witnesses and closes the most humane resolution.

## Mechanics View

- Node type: protected witness interview.
- Player verbs:
  - ask gently for shared symptoms;
  - compare bodily memory against paperwork;
  - decide whether to treat the witness as evidence or person first.
- Suggested checks:
  - `chk_dead_registry_infirmary_empathy` (`empathy`, diff 9) -> witness trust and fuller testimony.
  - `chk_dead_registry_infirmary_volition` (`volition`, diff 8) -> resist treating trauma as procedural leverage.
- Fail-forward rule:
  - even on poor rapport, shared symptoms surface:
    - memory gaps
    - burn scars
    - fear of steam and hot water

## State Delta

- Flags set:
  - `dead_registry_infirmary_complete`
  - optional: `preserved_returned_witness`
- Clues gained:
  - `clue_mercy_memory_gap`
- Quest stage changes:
  - `dead_registry=field_fork`
- Relationship deltas:
  - Mercy-positive handling strengthens `chapter_of_mercy`
  - coercive handling weakens future shelter cooperation

## Transitions

- To [[10_Narrative/Scenes/node_dead_registry_grave_or_parish|Node: Dead Registry Grave or Parish]]
- Return to map for lyceum cross-check without loss of progress

## Validation

- Scene must read as medical, social, and civic horror before it reads as supernatural.
- Priest must remain a witness-shelter gate, not a police proxy.
- Mercy route should enable the humane resolution without making it consequence-free.
- Checklist status:
  - [ ] Narrative_Gameplay_Checklist
