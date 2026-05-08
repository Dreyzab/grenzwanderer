---
id: scene_bank_conclusion
aliases:
  - Scene: Bank Conclusion
tags:
  - type/vn_scene
  - layer/vn
  - case/case01
  - phase/bank_investigation
---

# Scene: Bank Conclusion

## Context

**Location**: Bank Main Hall.
**Source Logic**: `case1_bank.logic.ts` (`bank_conclusion` -> `bank_conclusion_summary`)

## Script

**Trigger**:
"I have seen enough here." (from [[action_investigate_bank|Bank Hub]])

**Narrator**:
On the table, three things refuse to become one story: torn velvet, sweet
chemical grit, and Gustav's name moving through the night instead of toward
home.

**Victoria Sterling**:
"If I were you, Inspector, I would begin with the cloth."

**Elias Thorne**:
"That is precisely why I will not let it stand alone."

**Logic**:
The velvet belongs to disguise. The powder belongs to a supply route. The tavern
belongs to the people who moved both through Freiburg after dark.

## Lead Functions

| Lead | Case function | Dramatic pressure |
| --- | --- | --- |
| Tailor / costume trail | Identity bundle | Victoria's grief wants a face, but procedure keeps it from becoming tunnel vision. |
| Apothecary / compound trail | Chemical bundle | Procedure pushes past social preference. |
| Pub / night traffic trail | Logistics bundle | The working city contradicts the bank's version. |

## Effects

1. Set `bank_investigation_complete`.
2. Unlock `loc_tailor`, `loc_apothecary`, `loc_pub`, `loc_rathaus`,
   `loc_freiburg_estate`, and `loc_telephone`.
3. Grant 20 XP.

## Preservation Notes

Elias keeps the baseline identity: professional, observant, restrained, and
willing to pressure by procedure. Any sharper reaction here should be expressed
as player-choice variation later, not as a replacement personality.

## Next Phase

-> Freiburg open city / lead selection.
