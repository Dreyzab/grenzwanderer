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
  - id: CASE01_WAREHOUSE_LAWFUL
    text: Seal the floor, call the warrant, and force a lawful close.
    next: scene_case01_warehouse_lawful
    visible_if_all:
      - var_gte(convergence_route,1)
      - var_lte(convergence_route,1)
  - id: CASE01_WAREHOUSE_COMPROMISE
    text: Use the bureau ledger and force a compromised truth instead of a public one.
    next: scene_case01_warehouse_compromised
    visible_if_all:
      - var_gte(convergence_route,2)
      - var_lte(convergence_route,2)
```
