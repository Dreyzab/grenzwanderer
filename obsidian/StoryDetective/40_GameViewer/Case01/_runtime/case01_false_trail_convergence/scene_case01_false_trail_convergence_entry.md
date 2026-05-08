---
id: scene_case01_false_trail_convergence_entry
type: vn_scene
status: active
---

# Three Innocent Culprits

## Script

Lotte lays the slips side by side: river clay, wrong lantern, old military
dispatch, book measurements. "Too many guilty people," she says, "and none of
them holding the whole knife. That means someone held it from behind the
stage." The workers gave noise. The postal route gave movement. Roth gave the
target's shape. Thermite gave the method. The mind behind it did not think like
a thief.

```vn-logic
choices:
  - id: CASE01_FALSE_TRAIL_ASSEMBLE
    text: Assemble the three false centers into one engineering operation.
    next: scene_case01_false_trail_convergence_exit
    effects:
      - discover_fact(case_bankhaus_krebs_false_trail,fact_false_trails_are_tools)
      - discover_fact(case_bankhaus_krebs_false_trail,fact_engineer_operation_shape)
      - set_flag(false_trail_convergence_complete,true)
      - grant_xp(20)
```
