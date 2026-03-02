---
id: sys_inventory_merchant
tags:
  - type/system
  - domain/economy
---

# Inventory and Merchant Economy

Source of truth: `packages/shared/data/items.ts`

## Merchant Registry (Runtime)

| Merchant ID       | Character ID | Location ID       | Buy Multiplier | Sell Multiplier | Access Rule                                   |
| ----------------- | ------------ | ----------------- | -------------- | --------------- | --------------------------------------------- |
| `the_fence`       | `pawnbroker` | `loc_workers_pub` | 1.15           | 0.65            | `underworld_contact` OR `fct_underworld >= 2` |
| `apothecary_shop` | `apothecary` | `loc_apothecary`  | 1.05           | 0.45            | open                                          |
| `tailor_shop`     | `tailor`     | `loc_tailor`      | 1.20           | 0.50            | open                                          |
| `pub_keeper`      | `innkeeper`  | `loc_pub`         | 1.00           | 0.35            | open                                          |

## Stage-aware Stock (Case 01)

| Merchant          | Trigger Stage                     | Added Stock                   |
| ----------------- | --------------------------------- | ----------------------------- |
| `the_fence`       | `leads_open` (at_or_past)         | `forged_pass`, `map_fragment` |
| `apothecary_shop` | `leads_open` (at_or_past)         | `focus_draught`               |
| `tailor_shop`     | `bank_investigation` (at_or_past) | `district_pass`               |
| `pub_keeper`      | `leads_open` (at_or_past)         | `rumor_note`                  |

## Design Intent

- Merchant economy is a pacing lever, not only a wallet sink.
- Buyback values intentionally separate legal market vs underworld liquidity.
- Access rules create narrative pressure toward faction relationships.
