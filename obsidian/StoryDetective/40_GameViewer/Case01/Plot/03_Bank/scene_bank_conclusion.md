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

# 🏁 Scene: Bank Conclusion

## Context

**Location**: Bank Main Hall.
**Source Logic**: `case1_bank.logic.ts` (`bank_conclusion` -> `bank_conclusion_summary`)

## Script

**Trigger**:
"Ich habe hier genug gesehen." (From [[action_investigate_bank|Bank Hub]])

**Text**:
"Sie haben aus der Bank selbst gesammelt, was Sie konnten. Drei Spuren kristallisieren sich aus dem Chaos heraus:"

### Summary (`bank_conclusion_summary`)

**Speaker**: Clara von Altenburg.

**Text**:
"Der [[rote Samt]] weist auf einen [[Schneider oder Kostümbildner]]. Die [[chemischen Rückstände]] erfordern eine [[Analyse in der Apotheke]]. Und der [[Bächleputzer]] trinkt in der [[örtlichen Wirtschaft]]. Zeit, auf die Straßen Freiburgs zu gehen."

## Effects (End of Phase)

1.  **Set Quest Stage**: `case01` -> `leads_open`
2.  **Unlock Locations**:
    - `loc_tailor` (Tailor Shop)
    - `loc_apothecary` (Apothecary)
    - `loc_pub` (Pub / Wirtschaft)
3.  **Completion Flag**: `bank_investigation_complete`

## Next Phase

-> **Map: Freiburg (Open City)**
