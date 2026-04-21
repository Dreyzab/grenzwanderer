---
id: node_dead_registry_shadow_ledger
aliases:
  - Node: Dead Registry Shadow Ledger
tags:
  - type/node
  - status/proposed
  - layer/vn
  - phase/case01
  - loop/investigation
---

# Node: Dead Registry Shadow Ledger

## Trigger Source

- Planned route: `/vn/detective_dead_registry_shadow_ledger`.
- Suggested source: off-ledger archive cache or Agency caseboard cross-index after witness-pressure stage.
- Planned scenario anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/dead_registry/04_shadow_ledger/dead_registry_shadow_ledger.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/dead_registry/04_shadow_ledger/dead_registry_shadow_ledger.en.ts`

## Preconditions

- Required flags:
  - `dead_registry_witness_pressure_complete=true`
  - `dead_registry_shadow_ledger_found=false`
- Required evidence/items:
  - `clue_double_burial_number`
  - one of:
    - `clue_mercy_memory_gap`
    - `clue_thermite_lecture_notes`
    - `clue_redacted_service_leave`
- Required quest stage: `dead_registry=witness_pressure` preferred.

## Named Cast

- [[30_World_Intel/Characters/char_inspector|char_inspector]] - finally sees the system, not just the symptom.
- [[30_World_Intel/Characters/char_archive_keeper|char_archive_keeper]] - knows where the legal record stops and the shadow record begins.
- Lotte Weber - becomes relevant again as the bureau voice deciding whether this is evidence, resource, or contagion.

## Designer View

- Player intent: uncover the mechanism behind the contradictions.
- Dramatic function: central reveal.
- Narrative function: prove that the city keeps a second civic logic for people it once declared dead and later could not ignore.
- Emotional tone: quiet revelation, institutional disgust.
- Stakes: this knowledge changes how every earlier contradiction is read.

## Mechanics View

- Node type: evidence synthesis and interpretation.
- Core beats:
  - locate the off-ledger register;
  - decode status fields for absence, observation, and reinstatement;
  - connect the chemist's entry to the bank-side thermite rumor without converting rumor into verdict.
- Suggested checks:
  - `chk_dead_registry_shadow_logic` (`logic`, diff 11) -> identifies the register as policy, not accident.
  - `chk_dead_registry_shadow_encyclopedia` (`encyclopedia`, diff 10) -> decodes the secondary civic notation.
  - `chk_dead_registry_shadow_intuition` (`intuition`, diff 9) -> recognizes which entries imply active fear inside the system.
- Reveal rule:
  - no explicit Eden naming;
  - the registry proves containment, not metaphysical doctrine.

## State Delta

- Flags set:
  - `dead_registry_shadow_ledger_found`
- Clues gained:
  - `clue_shadow_registry`
- Rumors:
  - verify `rumor_returned_chemist`
  - verify `rumor_bank_thermite_teacher` if Lyceum route evidence exists
- Faction deltas:
  - hidden `the_returned` should move toward `Marked`
- Quest stage changes:
  - `dead_registry=shadow_ledger`

## Transitions

- To [[10_Narrative/Scenes/node_dead_registry_resolution|Node: Dead Registry Resolution]]
- Return to Agency debrief framing if a separate resolution room is preferred

## Validation

- The reveal must feel bureaucratically inevitable, not occultly theatrical.
- Shadow ledger proves the system exists; it does not prove what lies behind every absence.
- Bank hook must harden into plausibility, not certainty.
- Checklist status:
  - [ ] Narrative_Gameplay_Checklist
