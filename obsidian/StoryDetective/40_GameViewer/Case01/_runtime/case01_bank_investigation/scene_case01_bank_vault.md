---
id: scene_case01_bank_vault
type: vn_scene
status: active
background_url: /images/locations/loc_freiburg_bank/bank_vault.webp
---

# Vault Inspection

## Script

The main vault seems untouched by force because there was little left worth
forcing; the shelves gape clean and nearly empty. Deeper inside, one private
deposit box has been methodically melted open, its velvet lining scorched around
the absence. Slag and thermite residue coat the lock mechanism, and beside the
service grate lies a modified fumigation canister with postal twine still tied
around its handle. Someone spent industrial gas and thermite during busy
daylight hours to take only what was inside the private box: an esoteric
grimoire known as "Razlom". Metal has no loyalty; it simply refuses
Galdermann's tidy story. Victoria Sterling stops speaking when a pale residue
clings to her sample knife. She has seen that notation once before in the
sealed remains of her husband's case, copied into an archive under her father's
roof and filed under a mark no university laboratory is supposed to recognize.
The match is not an answer. It is only the old wound learning a new address.

```vn-logic
choices:
  - id: CASE01_BANK_VAULT_LOCK
    text: Compare the empty vault shelves with the melted private box.
    next: scene_case01_bank_conclusion
    skill_check:
      id: check_case01_vault_logic
      voice_id: attr_logic
      difficulty: 10
      show_chance_percent: true
      on_success:
        next: scene_case01_bank_conclusion
        effects:
          - set_flag(found_bank_contradiction,true)
      on_fail:
        next: scene_case01_bank_conclusion
    effects:
      - set_flag(vault_inspected,true)
  - id: CASE01_BANK_VAULT_AIR
    text: Catalogue the thermite slag and the modified gas canister together.
    next: scene_case01_bank_conclusion
    skill_check:
      id: check_case01_vault_intuition
      voice_id: attr_intuition
      difficulty: 12
      show_chance_percent: true
      on_success:
        next: scene_case01_bank_conclusion
        effects:
          - set_flag(found_residue,true)
          - grant_evidence(ev_bureau_forbidden_residue)
          - discover_fact(case_bankhaus_krebs_false_trail,fact_victoria_forbidden_residue)
      on_fail:
        next: scene_case01_bank_conclusion
    effects:
      - set_flag(vault_inspected,true)
```

## Dramatic Function

The vault turns social suspicion into material contradiction. The crime scene is
not "money stolen from a bank"; it is "a bank's missing money hidden by a raid
that targeted one private box."
