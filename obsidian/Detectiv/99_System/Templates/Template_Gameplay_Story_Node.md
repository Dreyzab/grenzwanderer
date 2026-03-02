---
id: tpl_gameplay_story_node
tags:
  - type/template
---

# Template Gameplay Story Node

```md
---
id: node_{slug}
aliases:
  - Node: { Display Name }
tags:
  - type/node
  - status/draft
  - layer/{ui|map|vn|system}
  - loop/{investigation|social|conflict|exploration|economy|meta}
---

# Node: {Display Name}

## Trigger Source

- Route:
- UI element:
- Input type:
- React component:
- Code anchor:

## Preconditions

- Required flags:
- Required evidence/items:
- Required quest stage:
- Fallback if missing requirements:

## Designer View

- Player intent:
- Dramatic function: {setup|complication|reveal|decision|consequence}
- Narrative function:
- Emotional tone:
- Stakes:

## Mechanics View

- Player verb:
- Node type: {informational|decision|resolution}
- Mechanics used:
- Skill checks:
  - Check id:
  - Voice id:
  - Difficulty:
  - On pass:
  - On fail:
- Resources:
- Rewards:

## State Delta

- Flags set:
- Flags unset:
- Evidence gained:
- Evidence lost:
- Quest stage changes:
- Map unlock/visibility changes:
- Resources (xp/money/items):
- Relationship deltas:

## Transitions

- Success -> [[node_{next_success}]]
- Soft fail -> [[node_{next_fail}]]
- Cancel -> [[node_{next_cancel}]]
- Recovery (if any) -> [[node_{next_recovery}]]

## Validation

- Test anchor:
- Done criteria:
- Checklist status:
  - [ ] Narrative_Consistency_Checklist
  - [ ] Narrative_Gameplay_Checklist
```
