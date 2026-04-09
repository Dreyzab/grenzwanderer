---
id: scene_case01_apothecary_entry
type: vn_scene
status: active
---

# Scene: Lowen Apotheke

## Script

The apothecary does not deny the compound once you name its smell. The residue
is real, the purchase route runs through university stock, and the order was
signed under cover of a sender name no honest clerk would trust twice.

```vn-logic
choices:
  - id: CASE01_APOTHECARY_COMPLETE
    text: Record the formula trail and move the chemical bundle forward.
    next: scene_case01_apothecary_exit
```
