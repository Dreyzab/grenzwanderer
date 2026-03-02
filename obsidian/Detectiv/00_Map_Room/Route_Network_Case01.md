---
id: route_network_case01
tags:
  - type/system
  - domain/world
  - topic/routes
---

# Route Network Case 01

## Scope

- Runtime source: `city_routes` seed in `supabase_seed.sql`.
- Convention: all route endpoints use `loc_*` identifiers.

## Core Mobility

- `loc_hbf <-> loc_freiburg_bank` (walk, tram)
- `loc_hbf <-> loc_freiburg_archive` (tram)
- `loc_freiburg_bank <-> loc_freiburg_archive` (walk)

## Leads Mobility

- `loc_freiburg_bank <-> loc_tailor` (walk)
- `loc_freiburg_bank <-> loc_apothecary` (walk)
- `loc_freiburg_bank <-> loc_pub` (walk)
- `loc_freiburg_archive <-> loc_apothecary` (walk)
- `loc_tailor <-> loc_pub` (walk)

## Industrial Mobility

- `loc_hbf <-> loc_freiburg_warehouse` (carriage)
- `loc_freiburg_bank <-> loc_freiburg_warehouse` (carriage)
- `loc_freiburg_warehouse <-> loc_workers_pub` (walk)

## Rule Link

- [[00_Map_Room/District_Rules|District_Rules]]
