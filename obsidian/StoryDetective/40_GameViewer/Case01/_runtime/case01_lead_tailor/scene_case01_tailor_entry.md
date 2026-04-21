---
id: scene_case01_tailor_entry
type: vn_scene
status: active
---

# Scene: Tailor Workshop

## Script

Herr Klein recognizes the torn velvet before he finishes pretending it is
ordinary stage cloth. Hartmann paid for a disguise runner, Box 217 stored the
costume, and somebody with bank access wanted to walk through Freiburg wearing
someone else's class.

```vn-logic
choices:
  - id: CASE01_TAILOR_COMPLETE
    text: Take the costume ledger copy and lock the identity trail.
    next: scene_case01_tailor_exit
```
