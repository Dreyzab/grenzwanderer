---
id: scene_case01_estate_exit
type: vn_scene
status: active
---

# Scene: Bureau Thread Confirmed

## Script

The ledger does not name the organization outright, but it names enough
participants to prove the bank theft was cover for a bureau-grade transfer
network. The case is suddenly larger than the man who will wear it in public.

```vn-logic
terminal: true
on_enter:
  - set_flag(estate_branch_complete,true)
  - grant_xp(15)
choices: []
```
