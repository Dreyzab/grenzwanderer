---
id: char_case01_krebs_mugger
node_type: character
case: case01
phase: investigation
status: active
runtime_character_id: npc_krebs_mugger
npc_identity: npc_krebs_mugger
tags:
  - type/character
  - origin/witch
  - faction/free_yards
---

# Krebs Mugger

![Portrait](/images/characters/krebs_mugger/krebs_mugger.webp)

**Runtime id**: `npc_krebs_mugger`
**Role**: Contract fist / street enforcer
**Affiliation**: Free Yards (street level) - Krebs payroll on contract
**Roster tier**: functional

## Profile

- Street-level contractor. He has nothing to do with the safe breach; his job is alley pressure in the Witch route.
- Scuffed knuckles, purse-first eyes, and the grotesque low layer of the same logic Galdermann uses at a desk.
- Where Galdermann dirties the pen, the Mugger dirties his hands. Both tell themselves they are just working.
- Intercepts Eleonora on the foggy walk home from the estate. Carries an order to remove her if the estate matter strays.

## Witch Route Function

- Escalation forces a curse-blooded reflex.
- If he survives, he becomes a future rumor source on Krebs through `rumor_witch_mugger_survivor`.
- If he dies, he leaves corpse pressure, heat, and a blood-stained thread back to Krebs.

## Rumor Hook

- `rumor_witch_mugger_survivor` - case `quest_banker`, leads to `loc_hbf`, sourced from Krebs payroll gossip. Verifies on `flag_set`.

## Player Dossier

- (reveal: `met_krebs_mugger_intro`) **The Contract Man**: A Free Yards enforcer on a Krebs-side order. Survive the alley and the city later whispers of an aristocrat who fed in the dark.
