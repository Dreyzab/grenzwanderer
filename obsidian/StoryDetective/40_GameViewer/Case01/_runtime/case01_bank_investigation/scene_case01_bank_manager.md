---
id: scene_case01_bank_manager
type: vn_scene
status: active
background_url: /images/locations/loc_freiburg_bank/bank_office.webp
---

# Director Galdermann

## Script

Heinrich Galdermann receives you with a smile polished for committees. He calls
the open vault a public outrage, names the culprits before you ask, and repeats
the phrase "postal workers" with the relief of a man handing you a leash. Gas
canisters in the lobby, uniforms at the service door, everyone unconscious: a
clean terror tactic, he says. Then he asks whether Fritz Muller's sealed
statements reached you intact while his hand straightens an already printed
robbery report beside half-empty smelling salts. The question arrives too early.

```vn-logic
choices:
  - id: CASE01_BANK_MANAGER_PRESS
    text: Press Galdermann on why he remembers the postal workers so clearly.
    next: scene_case01_bank_clerk
    effects:
      - set_flag(met_galdermann,true)
  - id: CASE01_BANK_MANAGER_BYPASS
    text: Let Galdermann talk until his procedure starts chasing the postal car for you.
    next: scene_case01_bank_clerk
    effects:
      - set_flag(met_galdermann,true)
```

## Dramatic Function

Galdermann tries to make the case procedural before Matthias can make it factual.
His postal certainty is useful evidence: either he saw more than he should have,
or he needs Matthias far away from the ledgers.
