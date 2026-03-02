---
id: tpl_scenario
tags:
  - type/template
---

# Template Scenario

```md
---
id: scn_{case}_{name}
aliases: ["Display Name", "legacy_scenario_id"]
tags:
  - type/scenario
  - status/seed
---

# [[scn_{case}_{name}]]

## Scope

- Case: `case_{nn}`
- Arc:
- Entry point: [[scene_{id}]]

## Scene Graph

- [[scene_{id_start}]] -> [[scene_{id_next}]]

## Related

- Quests: [[qst_{id}]]
- Locations: [[loc_{name}]]
```
