---
id: district_rules_case01
tags:
  - type/system
  - domain/world
  - topic/districts
---

# District Rules

## Goal

- Define district-level movement constraints separate from local flags.
- Keep stage gating (`Quest Stage`) and world gating (`District`) orthogonal.

## District Model

- `rail_hub`: station access and transit handoff.
- `altstadt`: core civic and banking zone.
- `schneckenvorstadt`: taverns and side leads.
- `wiehre`: university and specialist services.
- `stuhlinger`: industrial/warehouse zone.

## Runtime Rule (implemented)

- `stuhlinger` is restricted at `night`.
- Engine returns `locationAvailability.open = false` with alternatives:
  - `district_pass`
  - `wait_until_day`
- This is a soft gate (no hard fail in critical flow).

## Economy Rule (documented, not yet implemented)

- `altstadt` may apply merchant markup in evening/night windows.

## Source Links

- [[00_Map_Room/Route_Network_Case01|Route_Network_Case01]]
- `apps/server/src/modules/engine.ts`
