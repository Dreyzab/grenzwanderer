---
id: char_mother_hartmann
tags: [character, major]
tier: major
runtime_character_id: npc_mother_hartmann
npc_identity: npc_mother_hartmann
faction: house_of_pledges
aliases: ["Eleonora Hartmann", "Frau Hartmann"]
---

# Eleonora Hartmann

## Dossier

- **Role**: Aristocratic patron who manages social access, family reputation, and institutional debt as integrated systems.
- **Age / Appearance**: Late 40s. Composed posture, auburn hair pinned with understated precision. Dresses for authority without ostentation — muted fabrics, quality cuts. Her face softens only when she forgets she is being observed.
- **Archetype**: The Manager of Fragility
- **Origin**: Hartmann family, political layer of Freiburg. Survived decline by converting every room, association, and word into economically safe territory.

## Psyche Profile (Parliament Perception)

| Voice     | Reaction                                                                             | Threshold |
| --------- | ------------------------------------------------------------------------------------ | --------- |
| Tradition | "She reads a room the way a cartographer reads coastline."                           | 8         |
| Authority | "She never commands. She arranges inevitability."                                    | 7         |
| Empathy   | "She sees fear in others before they feel it themselves. Then she manages the fear." | 7         |
| Charisma  | "The warmth is real. The deployment of warmth is calculated."                        | 6         |
| Deception | "She does not lie. She curates which truths are visible."                            | 5         |

## Secrets

- **Surface**: Protective mother ensuring her son's career in a difficult world.
- **Hidden**: Manages a web of implicit debts and reciprocal obligations through `house_of_pledges` that amount to a shadow patronage network. Every favor she grants is an investment.
- **Core**: Her deepest fear is becoming unnecessary. If Felix can stand alone, the entire architecture of managed permissions that gave her life meaning was just control dressed as love.

## Relationships

- [[30_World_Intel/Characters/char_partner|char_partner]] — son. Protection experienced as control. She loves him and cannot stop designing his future.
- [[30_World_Intel/Characters/char_inspector|char_inspector]] — the detective. Parallel fragility — both manage truth for others and call it prudence.
- [[30_World_Intel/Characters/char_lotte_weber|char_lotte_weber]] — private companion. The only person around whom Eleonora relaxes her managerial persona.
- Factions: [[00_Map_Room/MOC_Factions|MOC_Factions]] — `house_of_pledges`

## Evolution

- **Stage 1** (start): **Elegant Handler.** Protective, composed, generous within carefully defined limits. Asks the detective to "watch over Felix."
- **Stage 2** (mid-game): **Covert Interferer.** Uses contacts and courtesy to bend investigative routes. "I trust you to make the right decision."
- **Stage 3** (crisis): **Forced Chooser.** Evidence against `house_of_pledges` forces her hand. Offers `political_cover` — her final attempt to manage the outcome.

## Political Cover Mechanic

- **Case01 — Demo**: Elegantly resolves a minor obstacle without being asked. Sets the precedent.
- **Case02 — Ultimatum**: Full-weight offer. Political cover in exchange for evidence suppression. By this point the player understands both her value and her price.

## Scenes & Quests

- Appears in: Case01 onboarding (train sequence, dining car with Lotte)
- Canon flags: `met_mother_intro`, `flag_joked_with_mother`, `flag_silent_observation`, `mother_redhead_secret_potential`

## Runtime Contract

- **NPC Identity**: `npc_mother_hartmann`
- **Faction**: `house_of_pledges`
- **Services**: `svc_eleonora_social_introduction`, `svc_eleonora_political_cover`
- **Signal States**: Measured response → Working courtesy → Doors held open
- **Coverage status**: Full authored dossier. System-integrated.
