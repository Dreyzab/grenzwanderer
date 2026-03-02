---
id: moc_parliament
tags:
  - mechanic
  - system
  - moc
aliases:
  - The Inner Parliament
  - Skills
---

# The Inner Parliament (Skills)

> Concept: The protagonist's psyche is split into 6 departments, each with 3 Voices that frame perception and decisions.

## Brain

- [[20_Game_Design/Voices/Voice_Logic|Logic]]: Deductive reasoning.
- [[20_Game_Design/Voices/Voice_Perception|Perception]]: Noticing details.
- [[20_Game_Design/Voices/Voice_Encyclopedia|Encyclopedia]]: Facts and context.

## Soul

- [[20_Game_Design/Voices/Voice_Intuition|Intuition]]: Warnings and gut reads.
- [[20_Game_Design/Voices/Voice_Empathy|Empathy]]: Emotional truth.
- [[20_Game_Design/Voices/Voice_Imagination|Imagination]]: Reconstruction and synthesis.

## Character

- [[20_Game_Design/Voices/Voice_Authority|Authority]]: Social pressure.
- [[20_Game_Design/Voices/Voice_Charisma|Charisma]]: Persuasion and rapport.
- [[20_Game_Design/Voices/Voice_Volition|Volition]]: Mental resilience.

## Body

- [[20_Game_Design/Voices/Voice_Endurance|Endurance]]: Pain and fatigue resistance.
- [[20_Game_Design/Voices/Voice_Agility|Agility]]: Movement and timing.
- [[20_Game_Design/Voices/Voice_Senses|Senses]]: Physical signal reading.

## Shadow

- [[20_Game_Design/Voices/Voice_Stealth|Stealth]]: Invisibility and positioning.
- [[20_Game_Design/Voices/Voice_Deception|Deception]]: Lies and misdirection.
- [[20_Game_Design/Voices/Voice_Intrusion|Intrusion]]: Locks and covert access.

## Spirit

- [[20_Game_Design/Voices/Voice_Occultism|Occultism]]: Esoteric patterns.
- [[20_Game_Design/Voices/Voice_Tradition|Tradition]]: Ritual and social memory.
- [[20_Game_Design/Voices/Voice_Gambling|Gambling]]: Risk appetite and odds play.

## Voice Matrix Hub

- [[20_Game_Design/Voices/MOC_Voice_Matrix|MOC Voice Matrix]]

## Dataview: Canonical Roster

```dataview
TABLE without id
  file.link as "Voice",
  voice_id as "voice_id",
  department as "department",
  readiness as "readiness",
  persona_archetype as "persona_archetype",
  gameplay_primary_loops as "gameplay_primary_loops"
FROM "20_Game_Design/Voices"
WHERE startswith(file.name, "Voice_")
SORT department ASC, voice_id ASC
```

## Dataview: Gaps

```dataview
TABLE without id
  file.link as "Voice",
  readiness as "Readiness",
  case01_node_hooks as "case01_node_hooks",
  persona_archetype as "persona_archetype",
  persona_philosophy as "persona_philosophy"
FROM "20_Game_Design/Voices"
WHERE startswith(file.name, "Voice_")
AND (
  readiness != "production"
  OR !case01_node_hooks
  OR length(case01_node_hooks) = 0
  OR !persona_archetype
  OR !persona_manners
  OR !persona_knowledge
  OR !persona_philosophy
  OR !persona_blind_spot
  OR !persona_core_drive
  OR !persona_stress_pattern
)
SORT file.name ASC
```
