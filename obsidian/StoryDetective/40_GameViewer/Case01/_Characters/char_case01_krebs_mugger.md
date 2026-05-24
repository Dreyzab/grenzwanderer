---
id: char_case01_krebs_mugger
node_type: character
case: case01
phase: investigation
status: active
tags:
  - type/character
  - origin/witch
  - faction/free_yards
---

# Krebs Mugger

![Portrait](/images/characters/krebs_mugger/krebs_mugger.webp)

**Runtime id**: `npc_krebs_mugger`
**Role**: Street enforcer carrying a contract from Bankhaus J.A. Krebs
**Affiliation**: Free Yards (street level) — Krebs payroll on contract
**Roster tier**: functional

## Profile

- Intercepts Eleonora on the foggy walk home from the estate. Carries an
  order on his person to remove her if the estate matter strays.
- Escalation forces a curse-blooded reflex. Two final shapes: he survives
  with a Blood Bond and becomes a future rumor source on Krebs, or he dies
  and leaves a corpse + +2 Heat in the alley.
- If he survives, the city later carries `rumor_witch_mugger_survivor` — a
  Krebs-side whisper about an aristocrat who fed in the alley.

## Rumor hook

- `rumor_witch_mugger_survivor` — case `quest_banker`, leads to `loc_hbf`,
  sourced from Krebs payroll gossip. Verifies on `flag_set`.

## Appearances

- `scene_case01_night_alley_witch` — Ночной Переулок
- `scene_case01_night_alley_escalation` — Срыв
