---
id: char_anna_mahler
tags: [character, major]
tier: major
runtime_character_id: npc_anna_mahler
npc_identity: npc_anna_mahler
faction: city_network
aliases: ["Anna Mahler", "The Fixer"]
---

# Anna Mahler

## Dossier

- **Role**: Railway fixer who turns the Hauptbahnhof's human traffic — porters, messengers, tavern staff — into a private intelligence network.
- **Age / Appearance**: Mid-30s. Practical coat, fingerless gloves, a ledger of favors kept in her head rather than on paper. Moves like someone who is always between two trains.
- **Archetype**: The Broker of Whispers
- **Origin**: Came up through the yards and the workers' pub rather than any institution. Owes nothing to the city's respectable layer and likes it that way.

## Psyche Profile (Parliament Perception)

| Voice      | Reaction                                                              | Threshold |
| ---------- | -------------------------------------------------------------------- | --------- |
| Perception | "She reads a platform the way Lotte reads a switchboard."            | 7         |
| Logic      | "Every favor is priced before she finishes hearing the request."     | 6         |
| Empathy    | "She protects her sources harder than she protects herself."         | 6         |
| Deception  | "She never lies. She decides which rumor reaches you and when."       | 5         |

## Secrets

- **Surface**: A well-connected fixer who can find anyone a contact, a route, or a rumor for the right consideration.
- **Hidden**: Her network is built on reciprocity, not coin. She tracks who owes whom across the whole city underclass and spends that ledger sparingly.
- **Core**: A burned source is a permanent loss. If the detective handles her channels carelessly, the network does not just go quiet — it starts checking the detective's timetable.

## Relationships

- [[30_World_Intel/Characters/char_inspector|char_inspector]] — the detective. A transactional relationship that can deepen into genuine trust if sources are protected.
- [[30_World_Intel/Characters/char_student_leader|char_student_leader]] — the fraternity-house route she can open with the Student House Introduction.
- Factions: [[00_Map_Room/MOC_Factions|MOC_Factions]] — `city_network`

## Evolution

- **Stage 1** (start): **The Broker.** Sells fast rumor triage through the rail-yard channels once the Workers' Pub lead is active.
- **Stage 2** (mid-game): **The Committed Network.** Puts part of her network on the detective's banker file, turning a closed fraternity house into a supported route — tracked as agency service work.
- **Stage 3** (strained): **The Withdrawn Channel.** If a source is burned, her network goes underground and access degrades until trust is rebuilt.

## Scenes & Quests

- Lead source for: `rumor_bank_rail_yard` (Rail Yard Ledger Whisper)
- Canon flags: `met_anna_intro`, `service_anna_student_intro_unlocked`

## Runtime Contract

- **NPC Identity**: `npc_anna_mahler`
- **Faction**: `city_network`
- **Services**: `svc_anna_whispers`, `svc_anna_student_intro`
- **Work Location**: `loc_agency` (home: `loc_workers_pub`)
- **Coverage status**: Full authored dossier. System-integrated.

## Player Dossier

- (reveal: met_anna_intro) **The Broker**: Find her around the Workers' Pub; she triages rumors through porters and tavern staff faster than any telegraph.
