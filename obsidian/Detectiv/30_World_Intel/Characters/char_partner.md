---
id: char_partner
tags: [character, major]
tier: major
runtime_character_id: partner
npc_identity: npc_felix_hartmann
faction: house_of_pledges
aliases: ["Felix Hartmann", "Felix"]
---

# Felix Hartmann

## Dossier

- **Role**: Junior field partner who turns paper, etiquette, and legal reasoning into investigative leverage.
- **Age / Appearance**: 21, sharp features, pale, neatly dressed in the Hartmann manner — everything pressed, buttoned, controlled. Dark hair parted with care. Looks older when he is tired, younger when he forgets to perform.
- **Archetype**: The Deferred Jurist
- **Origin**: Hartmann family, legitimate son of Eleonora Hartmann. Upward mobility through institution rather than inheritance alone. Carries the family name as both passport and cage.

## Psyche Profile (Parliament Perception)

| Voice        | Reaction                                                                           | Threshold |
| ------------ | ---------------------------------------------------------------------------------- | --------- |
| Logic        | "He maps every conversation into premises and conclusions before anyone finishes."  | 7         |
| Encyclopedia | "He quotes Pandekten before he quotes experience."                                 | 7         |
| Volition     | "He endures through discipline. He is terrified this is all he has."               | 6         |
| Empathy      | "He notices suffering. He categorizes it before he feels it."                       | 4         |
| Intuition    | "Muffled. He does not trust what cannot be cited."                                 | 3         |

## Secrets

- **Surface**: Educated assistant traveling under Eleonora's umbrella. Preparing for law faculty admission.
- **Hidden**: Consumed by philosophical doubt absorbed from university circles — the "question of values," the instrumentality of morality. This doubt manifests as apathy: not laziness, but the paralysis of someone who looked behind the curtain and found mechanism where he expected meaning.
- **Core**: He sought legitimacy through law and discovered that legitimacy itself is a social construct managed by people like his mother. His deepest fear is that self-authored ethics may be impossible — that every moral code is performance, including his own.

## Relationships

- [[30_World_Intel/Characters/char_inspector|char_inspector]] — mentor figure and mirror. The detective gives him field exposure but also uses his class literacy. Mixed motives on both sides.
- [[30_World_Intel/Characters/char_mother_hartmann|npc_mother_hartmann]] — mother. Protection experienced as control. He loves her and cannot breathe around her.
- Factions: [[00_Map_Room/MOC_Factions|MOC_Factions]] — `house_of_pledges` (inherited, contested).

## Evolution

- **Stage 1** (start): **Instrumental Idealist.** Quotes law, follows procedure, defers to the detective. Believes order exists if one reads the right text.
- **Stage 2** (mid-game): **Compromised Pragmatist.** Discovers results produce access faster than principles. Starts cutting corners, justifies it as field necessity.
- **Stage 3** (crisis): **The Abyss.** Realizes he is recreating Eleonora's logic of managed inevitability. Apathy strikes — goes cold, stops volunteering insight.
- **Stage 4a** (player-supported): **Self-Authored Ethics.** Constructs a personal moral code not inherited from law, family, or the detective. Can disagree with both.
- **Stage 4b** (player-neglected): **The Functionary.** Accepts the mechanism. Efficient, polite, empty. A Hartmann in full.

## Apathy Mechanic

Felix is subject to apathy episodes with gameplay consequences:

- **Stable**: Participates normally in joint checks.
- **Withdrawn**: Logic/Encyclopedia contributions drop. Answers but does not volunteer.
- **Apathetic**: Refuses specific checks. Detective must find alternatives through dirtier or more expensive routes.
- **Recovery**: Gradual. Requires player investment in Felix's agency and independence.

## Scenes & Quests

- Appears in: Case01 onboarding (train sequence, platform parting)
- Case hook: `case02_hook_university_network` — Felix's legal ambition becomes the bridge to the next investigation layer.
- Canon flags: `flag_defended_felix`, `flag_joked_with_mother`, `flag_silent_observation`

## Runtime Contract

- **NPC Identity**: `npc_felix_hartmann`
- **Faction**: `house_of_pledges` → potential drift to `college_of_reason`
- **Service**: `svc_felix_legal_analysis`
- **Coverage status**: Full authored dossier. System-integrated.
