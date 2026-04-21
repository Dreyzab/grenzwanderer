---
id: scene_case01_convergence_gate
type: vn_scene
status: active
---

# Scene: Convergence Gate

## Script

With at least two bundles locked, the case stops being a hunt for fragments and
becomes a choice of pressure. You can force the records open through the
Rathaus, or move through the workers and shadow traffic before the official
story catches up.

```vn-logic
choices:
  - id: CASE01_CONVERGENCE_OFFICIAL
    text: Commit to the official route through the Rathaus.
    next: scene_case01_convergence_official
  - id: CASE01_CONVERGENCE_COVERT
    text: Commit to the covert route through the workers' channel.
    next: scene_case01_convergence_covert
```
