---
id: template_evidence
aliases:
  - Evidence Template
  - Clue Template
tags:
  - type/template
  - domain/world
---

# Template: Evidence Item

## Usage

Copy this template for new evidence/clue files in `30_World_Intel/Items/`.

## Template

```markdown
---
id: clue_xxx OR ev_xxx
aliases:
  - [Human readable name]
tags:
  - type/evidence
  - category/clue OR category/item OR category/document
  - case/case01
  - source/[location_id]
---

# [id]

## Description

[What is this evidence? What does it look like/contain?]

## Acquisition

- **Scene**: [[10_Narrative/Scenes/node_xxx|Scene Name]]
- **Action/Check**: [How player obtains it]
- **Flag set**: `[flag_name]`

## Gameplay Impact

- [What does this clue unlock?]
- [Dialogue options, leads, checks affected]

## Related

- [[30_World_Intel/Characters/char_xxx|Related Character]]
- [[30_World_Intel/Items/clue_xxx|Related Evidence]]
```

## Naming Convention

| Prefix   | Usage                             |
| -------- | --------------------------------- |
| `clue_`  | Investigation clues, observations |
| `ev_`    | Physical evidence, documents      |
| `item_`  | Inventory items                   |
| `heard_` | Rumors, overheard information     |
