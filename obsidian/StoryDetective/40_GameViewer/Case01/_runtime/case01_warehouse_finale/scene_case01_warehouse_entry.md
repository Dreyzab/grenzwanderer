---
id: scene_case01_warehouse_entry
type: vn_scene
status: active
---

# Scene: Warehouse Door

## Script

The warehouse smells of wet timber, ledger ink, and a job that expected to end
before witnesses arrived. Galdermann is not alone, but he is the one who
understands what the room means if you leave with the right papers.

```vn-logic
choices:
  - id: CASE01_WAREHOUSE_TRACE_SAPPER_OFFICIAL
    text: Hold the room under warrant and identify the trained hand behind the cut.
    next: scene_case01_sapper_flashback
    visible_if_all:
      - var_gte(convergence_route,1)
      - var_lte(convergence_route,1)
  - id: CASE01_WAREHOUSE_TRACE_SAPPER_COVERT
    text: Keep the ledger quiet and identify the trained hand behind the cut.
    next: scene_case01_sapper_flashback
    visible_if_all:
      - var_gte(convergence_route,2)
      - var_lte(convergence_route,2)
```
