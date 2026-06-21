---
id: char_case01_sasha_hartmann_servant
node_type: character
case: case01
phase: investigation
status: active
runtime_character_id: npc_sasha_hartmann_servant
npc_identity: npc_sasha_hartmann_servant
knows:
  fact_konigsberg_household: always
  ev_sasha_russian_exile: always
  ev_sasha_narodnaya_volya: always
  ev_sasha_war_service: always
tags:
  - type/character
  - origin/witch
  - faction/house_of_pledges
---

# Alexander "Sasha"

![Portrait](/images/characters/sasha_hartmann_servant/sasha_hartmann_servant.webp)

**Runtime id**: `npc_sasha_hartmann_servant`
**Role**: Hartmann family servant — luggage, service corridors, household cover
**Affiliation**: House of Pledges (Hartmann household staff)
**Roster tier**: functional

## Profile

- Born around 1861 in the Russian Empire. At sixteen he went to the
  Russo-Turkish War (1877-1878) in place of his older brother.
- He proved physically strong, disciplined, and brave, but repeatedly crossed
  his commanders when orders became needlessly cruel — the seed of what came
  after.
- That conscience pulled him to the periphery of Narodnaya Volya. When
  Alexander II was killed on 1 March 1881 and the dragnet crushed the
  organization, a marked man with insubordination already on his record had to
  run.
- Eleonora's late husband — who already kept his wife's witch heritage as a
  private matter — knowingly took the exile into the Königsberg household. The
  debt is to that dead man.
- After the husband's death Sasha's loyalty passed forward to the widow and to
  Felix. Eleonora knows the truth and has simply grown used to him. His loyalty
  is built from debt and shelter, not slavish devotion — the devotion, if it
  ever existed, died with the husband.
- In early scenes he does not tell war stories. The past reads through his old
  scar, military bearing, strong body, controlled pain response, and refusal to
  panic under pressure.
- He knows Eleonora's symptoms well enough to cover them in public. He does not
  know the mystical truth of the curse.

## Knowledge

The `knows:` frontmatter is the engine-readable form of this profile — each Fact
maps to a condition over phase + flags (`always`, `never`, `phase >= …`,
`flag:KEY`). Sasha holds all four from the start; it is his own life. The Player
(Detective) starts blind to the `ev_*` ones and discovers them through play. See
`ADR_008_NPC_Knowledge` (Detectiv/99_System/ADR).

- `fact_konigsberg_household` — the household relocated to Freiburg from Königsberg.
- `ev_sasha_russian_exile` — Sasha is a Russian Empire exile.
- `ev_sasha_narodnaya_volya` — his pre-1881 revolutionary ties. **Leverage** with a
  blast radius beyond Sasha — see
  [[40_GameViewer/Case01/_Evidence/ev_sasha_narodnaya_volya|the evidence note]].
- `ev_sasha_war_service` — Russo-Turkish War, insubordination.

## Service

- `svc_sasha_service_corridors` — quiet access to estate service passages and
  pantry routes, unlocked when Sasha trusts Eleonora enough to keep the house
  routes useful.

## Appearances

- [[40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival|🚂 HBF Arrival]] —
  `scene_case01_hbf_luggage_incident_witch`
- `scene_case01_hbf_luggage_sasha_soft` — Саша у багажа
- `scene_case01_hbf_luggage_sasha_thirst` — Рука Саши
- `scene_case01_estate_vaults_witch` — Холодные Архивы

## Player Dossier

- (reveal: met_sasha_servant_intro) **The Quiet Veteran**: The Hartmann household servant who moves the luggage and covers Eleonora's spells in public. An old scar and a soldier's bearing hint at a war he never speaks of.
