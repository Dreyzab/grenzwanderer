---
id: scene_detective_case01_investigation
aliases:
  - "Scene: Detective Prologue - Investigation"
tags:
  - type/vn_scene
  - layer/vn
  - origin/detective
  - phase/prologue
---

# 🔍 Scene: Bank Vault — The Sapper's Wound

## Context

**Location**: Deep basement of Bankhaus J.A. Krebs.
**Characters**: Matthias Adler (player), Victoria Sterling (assistant).
**Tone**: Clinical, uncovering a performative crime.

## Script

The air in the vault is stagnant, smelling of burnt ozone and something sharp, like a chemistry lab after an accident. Victoria stands by the heavy steel doors, her gaze fixed not on the empty main shelves, but on a single row of private deposit boxes.

"The money was gone long before they arrived, Matthias," she says, her voice echoing in the cold stone chamber. "Galdermann is trying to hide a deficit behind a disaster."

You step closer to box #412. It doesn't look like it was forced; it looks like it was *violated*. A jagged, black-rimmed hole has been melted clean through the lock throat. Dark metallic slag—thermite residue—has dripped onto the floor, cooling into brittle, obsidian-like tears.

Inside, the velvet lining of the empty box is scorched at the edges.

"One box," you murmur. "They bypassed the gold for a single private lease. And they used sapper's tools to do it."

You notice a discarded industrial gas canister near the ventilation grate. It’s roughly tied with **yellow-black postal twine**—the same cord used to secure the manifest on the abandoned car outside.

```vn-logic
choices:
  - id: CASE01_VAULT_ANALYZE_SLAG
    text: Examine the thermite slag. (Requires: Logic)
    next: scene_case01_bank_logic_check
    effects:
      - add_clue("thermite_military_origin")
  - id: CASE01_VAULT_CHECK_TWINE
    text: Trace the postal twine back to the logistics chain.
    next: scene_case01_bank_logistics_lead
    effects:
      - change_stat("suspicion", 1)
```

## Dramatic Function

This scene breaks the 'bank robbery' genre. It reveals that the heist was a surgical strike disguised as a chaotic gas attack. The presence of military-grade thermite and the focus on a single box (Razlom) shifts the investigation from finance to mysticism and military engineering.
