---
id: scene_case01_convergence_official
type: vn_scene
status: active
---

# Scene: Official Route Set

## Script

You choose paper, seals, and public leverage. The next move will be legal on
its face and expensive in every other sense.

```vn-logic
terminal: true
on_enter:
  - set_flag(convergence_gate_seen,true)
  - set_var(convergence_route,1)
choices: []
```
