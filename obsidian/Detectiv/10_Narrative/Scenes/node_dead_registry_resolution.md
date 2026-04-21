---
id: node_dead_registry_resolution
aliases:
  - Node: Dead Registry Resolution
tags:
  - type/node
  - status/proposed
  - layer/vn
  - phase/case01
  - loop/resolution
---

# Node: Dead Registry Resolution

## Trigger Source

- Planned route: `/vn/detective_dead_registry_resolution`.
- Suggested map source: [[00_Map_Room/loc_agency|loc_agency]] after shadow-ledger retrieval.
- Planned scenario anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/dead_registry/05_resolution/dead_registry_resolution.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/side_quests/dead_registry/05_resolution/dead_registry_resolution.en.ts`

## Preconditions

- Required flags:
  - `dead_registry_shadow_ledger_found=true`
  - `dead_registry_resolution_locked=false`
- Required evidence/items:
  - `clue_shadow_registry`
- Required quest stage: `dead_registry=shadow_ledger`.

## Named Cast

- [[30_World_Intel/Characters/char_inspector|char_inspector]] - decides whether truth becomes leverage, record, or mercy.
- Lotte Weber - bureau-facing argument for containment and usable intelligence.
- [[30_World_Intel/Characters/char_priest|char_priest]] - moral counterweight for witness dignity.
- [[30_World_Intel/Characters/char_journalist|char_journalist]] - optional amplifier for controlled leak, not mandatory gate.

## Designer View

- Player intent: decide who owns the dead registry and what survives the cleanup.
- Dramatic function: parallel-case resolution with main-case residue.
- Narrative function: make institutional values visible through outcome, not through a villain confession.
- Emotional tone: severe, political, and morally asymmetrical.
- Stakes: every route solves something and sacrifices something.

## Mechanics View

- Node type: resolution split.
- Core routes:
  - `bureau_sealed`
    - protect the chemist as source
    - stabilize returned statuses quietly
    - maximize bureau standing
  - `controlled_leak`
    - release selected truth through Anna or anonymous press channel
    - increase political pressure while preserving the full ledger
  - `mercy_first`
    - destroy or sever the administrative control surface
    - protect witnesses, lose institutional leverage
- Availability rule:
  - leak route should remain playable without Anna-intro dependency; Anna improves precision and fallout control rather than unlocking the branch itself.

## State Delta

- Always:
  - `dead_registry_resolution_locked`
  - quest stage: `dead_registry=resolved`
- Bureau-sealed:
  - `dead_registry_chemist_protected=true`
  - agency standing up
  - `city_chancellery` friction contained
- Controlled leak:
  - Chancellery pressure up
  - `city_network` and press-facing consequence lines open
- Mercy-first:
  - `preserved_returned_witness=true`
  - `chapter_of_mercy` up
  - formal access friction rises
- Bank hook:
  - chemistry-teacher plausibility remains preserved across all branches

## Transitions

- End -> return to main Case 01 map loop
- Follow-up compatibility:
  - bank case can read the chemist as source, suspect, or protected contradiction depending on route

## Validation

- No branch may identify the chemistry teacher as the confirmed vault intruder.
- Leak route must function with or without Anna as named outlet.
- Resolution must change faction pressure and bank-case tone, not merely pay XP.
- Checklist status:
  - [ ] Narrative_Gameplay_Checklist
