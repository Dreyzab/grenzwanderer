---
id: scene_case01_bank_clerk
type: vn_scene
status: active
background_url: /images/locations/loc_freiburg_bank/bank_hall_1905.webp
---

# Ernst Vogel

## Script

Ernst Vogel has the pale obedience of a man who was told which truth would keep
his job. He swears the gas took everyone at once, then flinches at the ledger
book under Galdermann's blotter. The vault money was not there when the first
canister hissed. The thieves burned open private boxes while the bank performed
a robbery for its customers.

```vn-logic
choices:
  - id: CASE01_BANK_CLERK_READ
    text: Read Vogel's fear until the missing liquidity has a timestamp.
    next: scene_case01_bank_vault
    skill_check:
      id: check_case01_clerk_empathy
      voice_id: attr_empathy
      difficulty: 10
      show_chance_percent: true
      on_success:
        next: scene_case01_bank_vault
        effects:
          - set_flag(bank_liquidity_gone_before_raid,true)
          - grant_xp(10)
      on_fail:
        next: scene_case01_bank_vault
    effects:
      - set_flag(clerk_interviewed,true)
  - id: CASE01_BANK_CLERK_TIMELINE
    text: Rebuild the postal workers' timeline against the gas deployment.
    next: scene_case01_bank_vault
    skill_check:
      id: check_case01_clerk_logic
      voice_id: attr_logic
      difficulty: 10
      show_chance_percent: true
      on_success:
        next: scene_case01_bank_vault
        effects:
          - set_flag(postal_workers_inside_too_long,true)
          - grant_xp(10)
      on_fail:
        next: scene_case01_bank_vault
    effects:
      - set_flag(clerk_interviewed,true)
  - id: CASE01_BANK_CLERK_MOVE
    text: Take Vogel's fear and move to the vault.
    next: scene_case01_bank_vault
    effects:
      - set_flag(clerk_interviewed,true)
```

## Dramatic Function

The clerk scene keeps fail-forward intact. Empathy exposes Vogel's fear of
being made responsible for the missing liquidity; logic exposes that the postal
workers knew the building before the gas made witnesses useless.
