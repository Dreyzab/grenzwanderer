# Case01 Character Relationships

Status: `[PROJECT CANON]` / relationship control document.

This document records the current Case01 relationship logic around Lotte Weber,
Victoria Sterling, and Matthias Adler. It does not replace
[`docs/CHARACTER_ROSTER.md`](CHARACTER_ROSTER.md); it explains how the listed
characters should function together in scenes.

## Source-of-truth rule

- Runtime/display IDs and scene flags still win for what the player sees.
- Lore dossiers define motives, secrets, grief, friendship, and factional meaning
  only when tied back to runtime IDs.
- Victoria Sterling resolves to `victoria_sterling`.
- Lotte Weber resolves to `npc_weber_dispatcher`.
- Matthias Adler resolves to `inspector` for the detective origin.

## Accepted decision: Victoria's shadow case

Victoria's late husband, Dr. Julian Sterling, remains a **shadow case** in
Case01.

Case01 may echo Julian's death through:

- chemical residue;
- university chemistry contacts;
- sealed or deniable Rathaus papers;
- official language that feels too convenient;
- Bankhaus Krebs lies that rhyme with the old poisoning file.

Case01 must not solve Julian Sterling's death outright. The case should give
Victoria enough evidence to deepen her suspicion and change her relationship
with the detective, not enough to close the Sterling murder thread.

## Character quest rule

Victoria's shadow case is also her **character quest**:
`qst_victoria_shadow_case`.

The quest is not a second main investigation. It is a trust-and-restraint arc
inside Case01:

- if the detective respects Victoria as a professional, she becomes a stronger
  scientific partner;
- if he patronizes her, she still helps, but withholds personal context;
- if he exploits Julian's death as leverage, the partnership can become brittle;
- if he helps her separate evidence from vengeance, she stabilizes as an ally;
- if he feeds the revenge impulse, she risks becoming brilliant and dangerous.

## Core triangle

### Lotte Weber ↔ Victoria Sterling

Old friends. Lotte is not merely a switchboard source; she is one of the few
people who can tell when Victoria's composure has become a weapon.

Scene function:

- Lotte can warn Victoria before an official note arrives.
- Victoria can ask Lotte to trace a call pattern without opening a Rathaus file.
- Lotte can restrain Victoria from making the Sterling wound public too early.
- Victoria can endanger Lotte by pulling her into university/Rathaus pressure.

### Victoria Sterling ↔ Matthias Adler

Victoria is not a default assistant. She is a possible scientific partner attached
under political cover and professional risk.

Scene function:

- respect unlocks deeper forensic interpretation;
- patronizing treatment keeps her useful but emotionally closed;
- questions about Julian Sterling must be timed carefully;
- the detective can help her distinguish a clue from a wound.

### Lotte Weber ↔ Matthias Adler

Lotte does not serve the detective. She grants access when she sees method,
restraint, and respect for sources.

Scene function:

- switchboard traces;
- warnings;
- press-channel pressure if her hidden writing is discovered;
- relationship cost if the detective treats her as a tool.

## Dosage rules for scenes

Use Julian Sterling's death as a pressure signal, not a reveal engine.

Good Case01 uses:

- one sharp reaction from Victoria at the bank vault residue;
- a restrained conversation where Lotte recognizes that Victoria is not sleeping;
- a university contact who refuses to say Julian's name in writing;
- a Rathaus document whose wording is too neat;
- a finale beat where Victoria chooses evidence discipline over revenge.

Avoid in Case01:

- identifying Julian's killer;
- turning Bankhaus Krebs into the real Sterling case;
- giving Victoria a full revenge climax;
- making Lotte solve the chemistry;
- making the detective own Victoria's grief.

## Linked files

- [`docs/CHARACTER_ROSTER.md`](CHARACTER_ROSTER.md)
- [`obsidian/Detectiv/30_World_Intel/Characters/char_assistant.md`](../obsidian/Detectiv/30_World_Intel/Characters/char_assistant.md)
- [`obsidian/Detectiv/30_World_Intel/Characters/char_lotte_weber.md`](../obsidian/Detectiv/30_World_Intel/Characters/char_lotte_weber.md)
- [`obsidian/Detectiv/30_World_Intel/Families/family_adlersheim_sterling.md`](../obsidian/Detectiv/30_World_Intel/Families/family_adlersheim_sterling.md)
- [`obsidian/Detectiv/00_Map_Room/qst_victoria_shadow_case.md`](../obsidian/Detectiv/00_Map_Room/qst_victoria_shadow_case.md)
