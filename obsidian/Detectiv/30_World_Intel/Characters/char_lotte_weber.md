---
id: char_lotte_weber
tags: [character, major]
tier: major
runtime_character_id: npc_weber_dispatcher
npc_identity: npc_weber_dispatcher
knows:
  ev_eleonora_uncanny_nature: flag:flag_witch_lotte_noticed_strangeness
  ev_sasha_narodnaya_volya: never
faction: city_chancellery
aliases: ["Lotte Weber", "Red-haired Girl"]
---

# Lotte Weber

## Dossier

- **Role**: Chief telephone operator / shift lead at the Freiburg exchange. Information nexus positioned at the intersection of every conversation that passes through wire; hidden amateur journalist and city-note writer.
- **Age / Appearance**: 19. Vivid red hair, sharp eyes, direct gaze. Dresses practically but with small marks of personal taste — a pin, a ribbon, a collar fold that is not regulation. Carries herself with the confidence of someone who chose her position rather than fell into it.
- **Archetype**: The Switchboard Sphinx
- **Origin**: Minor aristocrat — enough lineage to navigate salon and switchboard alike. She chose the switchboard.

## Psyche Profile (Parliament Perception)

| Voice      | Reaction                                                                    | Threshold |
| ---------- | --------------------------------------------------------------------------- | --------- |
| Perception | "She reads line traffic the way a hunter reads tracks."                     | 7         |
| Charisma   | "Warm when she chooses. The warmth is a tool she controls."                 | 7         |
| Deception  | "Not lies — strategic omissions. She lives between what she knows and what she shares." | 6         |
| Logic      | "She cross-indexes before she speaks."                                      | 6         |
| Intuition  | "She trusts pattern before proof."                                          | 5         |

## Secrets

- **Surface**: Efficient telephone operator who keeps the city switchboard running and manages incoming contract files for the agency.
- **Hidden**: Secret journalist. Writes under a pseudonym. The telephone exchange gives her access to communication patterns — who calls whom, which lines go quiet before events, which offices redirect when investigations heat up. She converts switchboard intelligence into published leads.
- **Core**: Physical tells betray her hidden role — callus on the middle finger from sustained pen grip, ink traces in nail folds from writing with a steel nib, a worn notebook edge in her coat pocket.

## Relationships

- [[30_World_Intel/Characters/char_mother_hartmann|char_mother_hartmann]] — private companion. The only person around whom Eleonora relaxes. Wine, wit, and carefully artful compliments in the dining car. Not subservient — a peer relationship built on mutual intelligence.
- [[30_World_Intel/Characters/char_inspector|char_inspector]] — information channel. The Lotte interlude establishes her as a case-critical warning source. Trust determines depth of access.
- [[30_World_Intel/Characters/char_assistant|char_assistant]] — old friend. Victoria's grief and forensic obsession are not gossip to Lotte; they are a personal danger signal she has watched sharpen over time.
- [[30_World_Intel/Characters/char_partner|char_partner]] — Eleonora's son. Lotte treats him with humor and directness, not deference.
- Factions: [[00_Map_Room/MOC_Factions|MOC_Factions]] — `city_chancellery` (public), `city_network` affinity (hidden)

## Evolution

- **Stage 1** (start): **The Operator.** Efficient, reliable, warm enough to be approachable. Manages incoming files and keeps the duty board current. Introduces herself as the redhead in the dining car.
- **Stage 2** (Case01 midpoint): **The Warning Voice.** The Lotte interlude: she sees switchboard traffic redirect itself around the investigation and warns the detective. Trust or distance decision point.
- **Stage 3** (post-reveal): **The Press Channel.** If the detective discovers her journalist identity, she becomes either a publication channel (applied pressure through press) or a leverage point (silence for cooperation) or a dangerous exposure risk.

## Dual Function

| Layer | Function |
|-------|----------|
| **Case layer** | Switchboard patterns reveal who communicates about the case. Her existing interlude is a case-critical warning. |
| **Social layer** | Bridge between Eleonora's world (`house_of_pledges`) and the street (`city_network`). Belongs to neither fully. |
| **Journalist layer** | Hidden threat and opportunity. Discovery opens publication channel OR leverage point OR exposure risk. |

## Knowledge

`knows:` frontmatter (ADR_008) — what Lotte holds, distinct from the player's Evidence:

- `ev_eleonora_uncanny_nature` _(flag-gated)_ — only after the dining-car
  blood-sense moment (`flag_witch_lotte_noticed_strangeness`); a margin note, not
  proof of the curse. Dynamic knowledge.
- `ev_sasha_narodnaya_volya` _(never)_ — the household's deepest secret stays
  Bureau/household-internal; Lotte does not learn it.

## Scenes & Quests

- Appears in: Case01 onboarding (train dining car with Eleonora)
- Appears in: `case01_lotte_interlude` (telephone warning — trust/distance branch)
- Canon flags: `met_redhead_intro`, `lotte_interlude_complete`, `lotte_warning_heeded`, `mother_redhead_secret_potential`

## Runtime Contract

- **NPC Identity**: `npc_weber_dispatcher`
- **Faction**: `city_chancellery`
- **Services**: `svc_lotte_switchboard_trace` (+ future `svc_lotte_press_channel` post-reveal)
- **Work Location**: `loc_telephone`
- **Coverage status**: Full authored dossier. System-integrated. Normalized from former `npc_redhead_girl` duplicate.

## Player Dossier

- (reveal: lotte_interlude_complete) **The Warning**: She pulled you off the duty board to say it plainly — switchboard traffic was bending around your case before you noticed.
- (reveal: mother_redhead_secret_potential) **A Hidden Pen**: Ink in her nail folds, a callus from a steel nib. The operator writes, and what she writes finds its way into print.
