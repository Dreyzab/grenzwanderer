---
id: item_catalog
tags:
  - type/system
  - domain/economy
---

# Item Catalog

Source of truth: `packages/shared/data/items.ts`

| Item ID           | Name                  | Type       | Base Value | Narrative Context                                  |
| ----------------- | --------------------- | ---------- | ---------- | -------------------------------------------------- |
| `key`             | Rusty Key             | key_item   | 0          | Opens old locks tied to legacy spaces.             |
| `coin`            | Strange Coin          | clue       | 50         | Marker for hidden networks and old transactions.   |
| `cig`             | Half-smoked Cigarette | clue       | 0          | Scene residue linked to witness timelines.         |
| `bread`           | Stale Bread           | consumable | 2          | Survival staple for long field shifts.             |
| `lockpick`        | Lockpick Set          | resource   | 80         | Required for silent entry and night alternatives.  |
| `map_fragment`    | Torn Map Fragment     | clue       | 200        | Signals covert tunnel logistics.                   |
| `whiskey`         | Cheap Whiskey         | consumable | 30         | Bribe and social lubricant with flag side effect.  |
| `bandage`         | Sterile Bandage       | consumable | 18         | Stability item for attrition loops.                |
| `tonic`           | Restorative Tonic     | consumable | 42         | Endurance boost for long investigations.           |
| `focus_draught`   | Focus Draught         | consumable | 55         | Senses buff for evidence-heavy scenes.             |
| `starched_collar` | Starched Collar       | consumable | 65         | Social leverage in authority/charisma checks.      |
| `tailored_gloves` | Tailored Gloves       | resource   | 90         | Precision handling for sensitive clues.            |
| `hot_stew`        | Hot Stew              | consumable | 12         | Cheap sustain in pub loop.                         |
| `rumor_note`      | Rumor Note            | clue       | 90         | Converts tavern chatter into actionable lead.      |
| `district_pass`   | District Pass         | key_item   | 150        | Soft-gate bypass for restricted district flow.     |
| `forged_pass`     | Forged Transit Pass   | resource   | 170        | Risky access workaround tied to underworld routes. |

## Merchant Pricing Formula

- Buy price: `round(baseValue * buyMultiplier)`
- Sell price: `floor(baseValue * sellMultiplier)`
