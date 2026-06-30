---
id: qst_victoria_shadow_case
tags:
  - type/quest
  - status/active
  - character/victoria_sterling
  - case/case01
---

# Quest: Victoria Shadow Case

## Premise

Victoria Sterling's late husband, Dr. Julian Sterling, was a Freiburg University
chemist and lecturer. The official account frames his death as poisoning, but
Victoria knows enough chemistry — and enough of Julian's own competence — to
find the explanation wrong in its shape, not merely painful.

Case01 does not solve Julian Sterling's death. It turns the old wound into a
character quest: chemical echoes, university silences, Bankhaus Krebs residue,
and deniable Rathaus papers force Victoria to decide whether she is pursuing
evidence or feeding vengeance.

## Quest Type

Character quest / shadow case.

This quest is subordinate to Case01. It may alter Victoria's trust, scientific
availability, emotional stability, and later-case hooks. It must not become a
second main case inside Case01.

## Entry Conditions

- Victoria Sterling is attached to the investigation as `victoria_sterling`.
- Bankhaus Krebs forensic work has begun.
- At least one trust-bearing interaction with Victoria or Lotte Weber has
  occurred.

## Primary Anchors

| Anchor | Function |
| ------ | -------- |
| `scene_case01_bank_vault` | Chemical residue echoes Julian's file without solving it. |
| `char_lotte_weber` / `npc_weber_dispatcher` | Old friend and personal warning channel outside Rathaus procedure. |
| `family_adlersheim_sterling` | Family pressure, deniable access, and the rule that Julian's death remains unresolved. |
| University chemistry contacts | Refusal, euphemism, or missing lab language around Julian's work. |
| Rathaus papers | Official wording that is too neat to be emotionally or scientifically true. |

## Stage Table

| Stage | Goal | Primary Risk |
| ----- | ---- | ------------ |
| `stage_00_wound` | Establish Julian's death as the private reason Victoria studies forensic criminology. | Exposition dump or melodrama. |
| `stage_01_echo` | Bank residue or gas notation rhymes with the sealed Sterling file. | Player mistakes the echo for a solved clue. |
| `stage_02_friend_warning` | Lotte notices Victoria sharpening into revenge and warns either Victoria or the detective. | Lotte becomes a therapist instead of an information broker. |
| `stage_03_university_silence` | A chemistry contact refuses to document what they know. | University branch bloats into a second investigation. |
| `stage_04_restraint_choice` | Victoria chooses evidence discipline, revenge pressure, or guarded withdrawal depending on trust. | The quest resolves Julian's death too early. |

## Outcomes

### Stabilized ally

The detective treats Victoria as a professional and refuses to use Julian as a
lever. Victoria remains severe but trusts the method. Later scenes may unlock
higher-confidence forensic readings.

### Brilliant but brittle

The detective validates her suspicion but does not help her separate evidence
from grief. Victoria becomes more useful in chemical analysis and more dangerous
in judgment calls.

### Closed consultant

The detective patronizes her or exploits the Sterling wound. Victoria still
performs the scientific work, but personal context closes and Lotte becomes a
more important indirect route.

## Hard Boundary

Case01 may reveal contradictions around Julian Sterling's death, but it must not
identify his killer, close the Sterling murder, or turn Bankhaus Krebs into the
true Julian case.

## Related Files

- [[30_World_Intel/Characters/char_assistant|Victoria Sterling]]
- [[30_World_Intel/Characters/char_lotte_weber|Lotte Weber]]
- [[30_World_Intel/Families/family_adlersheim_sterling|Adlersheim-Sterling Family]]
- [[10_Narrative/Case_01_Evidence_Graph|Case 01 Evidence Graph]]
- [[00_Map_Room/qst_victoria_poetry|qst_victoria_poetry]] — separate soft cultural thread, not the Sterling shadow case.
