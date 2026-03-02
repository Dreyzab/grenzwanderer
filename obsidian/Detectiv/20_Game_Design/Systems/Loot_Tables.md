---
id: loot_tables
tags:
  - type/system
  - domain/economy
---

# Loot Tables

## Case 01 Location Loot

| Location ID              | Common (60-80%)       | Uncommon (20-35%)        | Rare (5-10%)    |
| ------------------------ | --------------------- | ------------------------ | --------------- |
| `loc_freiburg_bank`      | `cig`, `coin`         | `map_fragment`           | `district_pass` |
| `loc_tailor`             | `tailored_gloves`     | `starched_collar`        | `map_fragment`  |
| `loc_apothecary`         | `bandage`             | `tonic`, `focus_draught` | `forged_pass`   |
| `loc_pub`                | `hot_stew`, `whiskey` | `rumor_note`             | `district_pass` |
| `loc_workers_pub`        | `whiskey`             | `lockpick`, `rumor_note` | `forged_pass`   |
| `loc_freiburg_warehouse` | `lockpick`            | `map_fragment`           | `forged_pass`   |

## Rule Notes

- Rare drops should not replace quest-critical rewards.
- Loot tables should respect current quest stage and avoid early power spikes.
- Contraband-weighted tables are gated by faction access and/or flags.
