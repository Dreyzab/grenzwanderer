---
id: scene_case01_warehouse_sapper
type: vn_scene
status: active
case: case01
characterId: npc_albrecht_stoll
---

# Scene: The Technical Guard (Warehouse)

> Runtime beat. Sits between the warehouse entry and the existing finale beats
> ([[scene_case01_warehouse_entry|warehouse_entry]] /
> [[scene_case01_warehouse_lawful|lawful]] /
> [[scene_case01_warehouse_compromised|compromised]]). Honors canon: Galdermann
> is the man being closed; the Sapper is the executor; the Architect stays
> unnamed.

## Script

Galdermann is not alone. The second man does not look like a banker's hire — he
stands the way a soldier stands when the room is a position to be held. Broad
shoulders, a postman's coat that still fits him wrong, chemical-resistant gloves
he has not bothered to take off. The same hands from the vault.

He looks at the slag photographs in your folder, then at you, and something in
him relaxes — not relief, recognition. You did the work. He respects work.

"You found the cut," he says. "Then you know I left the building standing. A
thief would have wrecked the room." He does not deny the thermite. He denies
being a thief. To him those are different crimes.

Galdermann's composure is gone; the Sapper's is intact. Whatever happens next,
the banker will bargain and the officer will not — unless you give him a reason
that outranks the man who bought his debt.

```vn-logic
choices:
  - id: CASE01_WAREHOUSE_SAPPER_LAWFUL
    text: Seal the floor, call the warrant, and force a lawful close.
    next: scene_case01_warehouse_lawful
    visible_if_all:
      - var_gte(convergence_route,1)
      - var_lte(convergence_route,1)
  - id: CASE01_WAREHOUSE_SAPPER_NEGOTIATE
    text: Use the bureau ledger and force a compromised truth instead of a public one.
    next: scene_case01_warehouse_compromised
    visible_if_all:
      - var_gte(convergence_route,2)
      - var_lte(convergence_route,2)
```

## Design Notes

- **Lawful fork**: the Sapper makes a disciplined stand to cover Galdermann; the
  warrant holds the room anyway. Galdermann collapses; the breach hand is taken,
  but says nothing precise about the Architect.
- **Compromised fork**: pressed with Bureau leverage, he slips into reporting
  posture and trades the *shape* of his former commanding officer (never the
  name) for a quiet exit. The Architect remains a hook into the University
  thread.
- **Guardrail**: in neither fork is the Architect named or confronted. The Sapper
  is the deepest the player reaches inside Case 01.
