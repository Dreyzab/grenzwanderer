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

> **Canon note.** This is the single source of truth for Eleonora. The old
> `char_eleonora.md` ("Eleonora **Kessler**", Felix-as-valet, no curse) under
> `data/viking/.../obsidian/char_eleonora/` is a **superseded pre-witch draft** —
> see [[#Reconciliation log]]. Her surname is **Hartmann**, never "Vance"
> (that is the journalist origin, Arthur Vance).

## Two lenses on one person

Eleonora is authored once but met two ways. Both are the same woman; what differs
is who is looking.

- **As NPC (Detective's case):** `patron_arranger ▸ concealed_threat`
  (CHARACTER_CONCEPT). The player meets the patron — the Manager of Fragility.
  The witch beneath is a flag-gated reveal, never visible at first meeting.
- **As playable origin (`witch`):** the player *is* Eleonora, and the curse is the
  spine of play. See `originProfiles.ts` (`witch`, Eleonora Hartmann, 45, Blood
  Curse) and [[WITCH_VOLITION_AND_VETO_SPEC]] for her volition/Veto economy.

The same dossier serves both; the NPC lens hides the Core, the origin lens lives
inside it.

## Dossier

- **Role**: Aristocratic patron who manages social access, family reputation, and
  institutional debt as integrated systems.
- **Age / Appearance**: Late 40s. Composed posture, auburn hair pinned with
  understated precision. Dresses for authority without ostentation — muted
  fabrics, quality cuts. Her face softens only when she forgets she is being
  observed. (Origin sheet: 45; Karlsruhe Hochadel.)
- **Archetype**: The Manager of Fragility — and, beneath it, the Manager of her
  own Hunger.
- **Origin**: Hartmann family, political layer of Freiburg. Survived decline by
  converting every room, association, and word into economically safe territory.

## Psyche Profile (Parliament Perception)

How the Detective's parliament reads her. The first five are the patron surface;
the last two only fire once the player has cause to look past it.

| Voice      | Reaction                                                                             | Threshold |
| ---------- | ------------------------------------------------------------------------------------ | --------- |
| Tradition  | "She reads a room the way a cartographer reads coastline."                            | 8         |
| Authority  | "She never commands. She arranges inevitability."                                    | 7         |
| Empathy    | "She sees fear in others before they feel it themselves. Then she manages the fear." | 7         |
| Charisma   | "The warmth is real. The deployment of warmth is calculated."                        | 6         |
| Deception  | "She does not lie. She curates which truths are visible."                            | 5         |
| Composure  | "Her control is too complete. People that composed are holding something shut."       | 8         |
| Occultism  | "The air near her is wrong — a cold seam, a draft that breathes the wrong way."       | 9         |

## Secrets

Layered surface → core. Per CHARACTER_CONCEPT spoiler policy, everything below is
**design-only** (it is not extracted into the shipping `NpcBio`); only the
flag-gated `## Player Dossier` stages ship.

- **Surface**: Protective mother ensuring her son's career in a difficult world.
- **Hidden (social)**: Manages a web of implicit debts and reciprocal obligations
  through `house_of_pledges` that amounts to a shadow patronage network. Every
  favor she grants is an investment.
- **Concealed (occult)**: She is a witch under the IVMR Masquerade. Passive Veil
  Sight is always on; she reads the spirit world the way she reads a salon. The
  patron network is partly a tool to keep the Masquerade intact — to buy silence
  and arrange which truths stay invisible (the same skill, two registers).
- **Core**: A Blood Curse — an affliction "not unlike vampirism" (`witch` origin
  flaw). Suppressing its hunger drains her composure (the Façade and the
  thirst-lid drawn from one well — see [[WITCH_VOLITION_AND_VETO_SPEC]]). Her two
  fears braid here: the social fear of **becoming unnecessary** (if Felix can
  stand alone, the architecture of managed permissions was control dressed as
  love) and the existential fear of **becoming the monster** (every cruel,
  dominant, predatory act — the things she is *best* at — steps her toward full
  Обращение). What she is strongest at is what damns her.

## The husband, and the origin of the curse

(Salvaged from the superseded Kessler draft and reframed into canon.) Her husband
died suddenly and strangely; creditors then stripped the estate over debts she
had not known existed. The "strange object" she kept from his effects — a relic
she is too afraid to look at directly — is tied to the affliction: his death and
her curse share a source (a Rift-touched relic / Eden anomaly). She hides this
from Felix to protect him, exactly as she hides the Masquerade and the hunger.
The debt network grew from that ruin: control rebuilt over the wreckage of a
fall she did not see coming.

## Relationships

- [[30_World_Intel/Characters/char_partner|char_partner]] (Felix Hartmann,
  `npc_felix_hartmann`) — son. Protection experienced as control. She loves him
  and cannot stop designing his future. He is the live charge behind
  `[КРОВНЫЕ УЗЫ]` — the oxytocin-loyalty voice that will turn her monstrous *for*
  him.
- Sasha (`npc_sasha_hartmann_servant`) — household servant. Reads her symptoms —
  the tremor, the glove, the held breath — but not the occult truth behind them.
  The closest witness to the curse who does not know its name; the Warm-Veto
  fulcrum (see his luggage scene, `scene_case01_hbf_luggage_sasha_thirst`).
- [[30_World_Intel/Characters/char_inspector|char_inspector]] — the detective.
  Parallel fragility — both manage truth for others and call it prudence.
- [[30_World_Intel/Characters/char_lotte_weber|char_lotte_weber]] — private
  companion, the red-haired operator. The only person around whom Eleonora
  relaxes her managerial persona — and therefore the person nearest the cracks in
  the Façade.
- The Baroness (Case01 estate) — status peer and creditor-adjacent; the estate
  one-shot's social/occult pressure cooker (`scene_case01_baroness_office_witch`).
- **Hieronymus** (Executor) — *proposed, not yet vault canon.* The Church hunter
  who turns toward her trail when the Masquerade breaks loudly. Wired to Tier-3
  curse overflow in [[WITCH_VOLITION_AND_VETO_SPEC]] (`flag_witch_executor_on_trail`).
- Factions: [[00_Map_Room/MOC_Factions|MOC_Factions]] — `house_of_pledges`

## Evolution

Two interleaved arcs: the social arc (how the Detective experiences her) and the
curse arc (what the witch origin lives through). They share state.

- **Stage 1** (start): **Elegant Handler.** Protective, composed, generous within
  carefully defined limits. Asks the detective to "watch over Felix." Curse arc:
  pressure low, Façade easy, thirst a distant tick.
- **Stage 2** (mid-game): **Covert Interferer.** Uses contacts and courtesy to
  bend investigative routes. "I trust you to make the right decision." Curse arc:
  pressure climbing; Façade DC rises (`facadeDifficulty`); first real Veto costs.
- **Stage 3** (crisis): **Forced Chooser.** Evidence against `house_of_pledges`
  forces her hand; offers `political_cover`. Curse arc: the branching endings —
  held the line / partial fall / exposed-and-hunted / terminal Обращение — gated
  on feeding, Warm Vetoes taken, and whether the Façade broke in public.

## Political Cover Mechanic

- **Case01 — Demo**: Elegantly resolves a minor obstacle without being asked. Sets
  the precedent.
- **Case02 — Ultimatum**: Full-weight offer. Political cover in exchange for
  evidence suppression. By this point the player understands both her value and
  her price.

## Scenes & Quests

- Appears in: Case01 onboarding (train sequence, dining car with Lotte); witch
  origin runtime (`scene_case01_witch_*`, the Sasha luggage incident, the estate).
- Canon flags: `met_mother_intro`, `flag_joked_with_mother`,
  `flag_silent_observation`, `mother_redhead_secret_potential`,
  `flag_witch_helped_sasha_hbf`, `flag_witch_warm_veto_sasha_hbf`
- Curse state vars (witch origin): `witch_blood_curse_pressure`,
  `witch_blood_curse_tier`, `witch_blood_power`, `witch_blood_debt`,
  `witch_alcohol_aftertaste`, `resource_volition_token` (see `witchRules.ts`).

## Runtime Contract

- **NPC Identity**: `npc_mother_hartmann`
- **Faction**: `house_of_pledges`
- **Services**: `svc_eleonora_social_introduction`, `svc_eleonora_political_cover`
- **Signal States**: Measured response → Working courtesy → Doors held open
- **Coverage status**: Full authored dossier. System-integrated.

## Player Dossier

- (reveal: flag_joked_with_mother) **Warmth on Display**: She laughs at your joke
  and means it — then you watch her file the laugh away for later use.
- (reveal: mother_redhead_secret_potential) **The Companion**: The only person
  around whom she lets the managerial mask slip is the red-haired operator.
- (reveal: flag_silent_observation) **Too Composed**: There is a stillness she
  keeps that is not calm. She is holding something shut, and the effort costs her.

## Reconciliation log

- **Surname**: Hartmann is canon (spine `freiburg_social_catalog.ts:
  npc_mother_hartmann`, and `originProfiles.ts: witch`). "Kessler" (old draft) and
  "Vance" (a name bug in two mechanics docs; Vance = the journalist origin) are
  **wrong**.
- **Felix**: legitimate Hartmann son / junior field partner (`npc_felix_hartmann`),
  **not** a valet. The valet framing was the Kessler draft.
- **Status**: declined-but-managing aristocrat with a household servant (Sasha),
  not destitute. The "fallen widow" pathos survives only as backstory texture.
- **Husband / artifact**: salvaged from the Kessler draft and reframed as the
  origin of the Blood Curse (see [[#The husband, and the origin of the curse]]).
- **Action item**: delete the superseded `char_eleonora.md` (Kessler) once the
  owner confirms nothing else points at it.
