---
id: scene_case01_bank_conclusion
type: vn_scene
status: active
background_url: /images/locations/loc_freiburg_bank/bank_vault.webp
---

# Three Open Leads

## Script

On the table, three cracks refuse to close. Thermite residue points toward a
chemist, an engineer, or a supplier with military habits. The gas canister and
postal twine point toward a real route someone bent out of shape. The missing
liquidity points back through Galdermann's private ledgers. Victoria looks first
to the theatrical disguise because grief wants a face. Then she reins herself
back to procedure: material, logistics, embezzlement.

```vn-logic
terminal: true
on_enter:
  - set_flag(bank_investigation_complete,true)
  - unlock_group(loc_tailor)
  - unlock_group(loc_apothecary)
  - unlock_group(loc_pub)
  - unlock_group(loc_rathaus)
  - unlock_group(loc_freiburg_estate)
  - unlock_group(loc_telephone)
  - grant_xp(20)
choices: []
```

## Dramatic Function

The lead phase opens from evidence pressure. The postal route remains useful,
but no longer innocent; the bank robbery is now visibly a cover story for a
ledger crime and a targeted theft.
