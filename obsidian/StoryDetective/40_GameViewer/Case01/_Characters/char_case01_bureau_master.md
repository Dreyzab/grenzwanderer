---
id: char_case01_bureau_master
node_type: character
case: case01
phase: onboarding
status: active
runtime_character_id: npc_bureau_master
npc_identity: npc_bureau_master
knows:
  ev_sasha_narodnaya_volya: always
tags:
  - type/character
  - origin/witch
  - faction/the_returned
---

# The Master

![Portrait](/images/characters/bureau_master/bureau_master.webp)

**Runtime id**: `npc_bureau_master`
**Role**: Bureau occult supervisor (Witch prologue handler)
**Affiliation**: The Returned — Freiburg Bureau, occult wing
**Roster tier**: functional

## Profile

- Receives Eleonora at the secret Bureau office under HBF the night she arrives
  on the Witch route.
- Offers two ritual paths in the same scene: the sanctioned chemical
  suppressant, and an unattended raw altar shard that the curse can siphon.
- Notices everything. Treats discipline as the Bureau's standing answer to
  coven excess; treats theft as a debt to be paid in blood.

## Knowledge

The Bureau holds the household's secrets as collateral behind the cover it
rations. The Master carries Sasha's Narodnaya Volya file from the start — the
holder side of that leverage Fact (`always`). The Player only learns the Bureau
holds it through the induction beat (see the evidence note). See
`ADR_008_NPC_Knowledge` (Detectiv/99_System/ADR).

- `ev_sasha_narodnaya_volya` — held as standing leverage over the Hartmann
  House; see
  [[40_GameViewer/Case01/_Evidence/ev_sasha_narodnaya_volya|the evidence note]].

## Service

- `svc_bureau_occult_protocol` — sanctioned occult cover and suppressant
  rationing for Witch agents who keep the Maskerade.

## Appearances

- [[40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival|🚂 HBF Arrival]] —
  `scene_case01_witch_bureau_master_meeting`

## Player Dossier

- (reveal: met_bureau_master_intro) **The Bureau's Eye**: He receives you in the secret office beneath the HBF, offers the sanctioned suppressant, and treats discipline as the Bureau's standing answer to coven excess.
