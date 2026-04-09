---
id: scene_case01_convergence_covert
type: vn_scene
status: active
---

# Scene: Covert Route Set

## Script

You choose informants, timing, and deniable access. The next move will be
faster, dirtier, and much harder to explain afterward.

```vn-logic
terminal: true
on_enter:
  - set_flag(convergence_gate_seen,true)
  - set_var(convergence_route,2)
choices: []
```
