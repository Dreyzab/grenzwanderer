---
id: tpl_event
tags:
  - type/template
---

# Template Event

```md
---
id: evt_{id}
aliases: []
tags:
  - type/event
  - status/seed
time: time_{slot}
location: loc_{name}
characters: [char_{name}]
caused_by: [evt_{id_prev}]
leads_to: [evt_{id_next}]
related_scenes: [scene_{id}]
sets_flags: []
---

# [[evt_{id}]]

## Event Statement

- What objectively happened:

## Motivation

- Why it happened:

## Impact

- Immediate effects:
- Long-term effects:

## Links

- Time: [[time_{slot}]]
- Location: [[loc_{name}]]
- Scene(s): [[scene_{id}]]
```
