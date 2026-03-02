---
id: tech_architecture
tags:
  - type/tech
  - status/stable
---

# Tech Architecture

Primary references:

- `ARCHITECTURE.md`
- `README.md`
- `update.md`

Code anchors:

- Frontend: `apps/web`
- Backend: `apps/server`
- Shared: `packages/shared`
- Contracts: `packages/contracts`

Current runtime invariants:

- User context: `auth.userId -> x-user-id/x-demo-user-id -> demo_user`.
- Objective resolution: by stable `locationId` (not hardcoded point mapping).
- `loc_*` is canonical world identity; `map_point` is interaction/presentation layer.
- Fog of war should evolve on location progression, not on single scene completion.
