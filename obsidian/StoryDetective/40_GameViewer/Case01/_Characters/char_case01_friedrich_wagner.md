---
id: char_case01_friedrich_wagner
node_type: character
case: case01
phase: investigation
status: active
runtime_character_id: npc_friedrich_wagner
npc_identity: npc_friedrich_wagner
tags:
  - type/character
  - origin/witch
  - faction/the_returned
---

# Friedrich Wagner

![Portrait](/images/characters/friedrich_wagner/friedrich_wagner.webp)

**Runtime id**: `npc_friedrich_wagner`
**Role**: Dead estate accountant — keeps the smuggling ledger as a spirit
**Affiliation**: The Returned (post-mortem); formerly Bankhaus J.A. Krebs adjacent
**Roster tier**: major

## Profile

- Murdered in the Grand Estate ice-vault by the Baroness's Krebs-side
  partners after finding the smuggling ledger; the Baroness sealed the room
  and called the death a cold accident.
- Manifests around the brass-bound ledger box and reads the room for
  willingness to carry the case forward.
- Three exits in the showdown: Justice (he yields the ledger and rests),
  Subjugate (bound to Eleonora's shadow, ledger taken under duress), Banish
  (sealed away with the truth, no ledger).

## Evidence

- `ev_friedrich_ledger_testimony` — the smuggling ledger and the dead
  accountant's testimony anchored to it.

## Service

- `svc_friedrich_ledger_memory` — only meaningful when Friedrich was treated
  with Justice or bound; supplies cross-references against the Krebs partners.

## Appearances

- `scene_case01_ghost_showdown_witch` — Призрак Счетовода
- [[40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_evidence_collection|👻 Estate Evidence Sweep]]

## Player Dossier

- (reveal: met_friedrich_wagner_intro) **The Accountant's Shade**: He manifests around the brass-bound ledger box, weighing whether you will carry the case forward.
