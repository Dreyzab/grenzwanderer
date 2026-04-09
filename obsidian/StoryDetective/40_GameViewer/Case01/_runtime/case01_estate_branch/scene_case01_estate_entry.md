---
id: scene_case01_estate_entry
type: vn_scene
status: active
---

# Scene: Estate Ledger

## Script

The estate is not haunted. It is staged. Someone used a private villa outside
the main routes to store telegraph copies, costume receipts, and a payment log
written in the careful half-code of people who expected the clerk to die before
the archive survived.

```vn-logic
choices:
  - id: CASE01_ESTATE_TRACE
    text: Take rubbings of the bureau ledger and keep the route off the official sheet.
    next: scene_case01_estate_exit
    effects:
      - set_flag(bureau_trace_found,true)
```
