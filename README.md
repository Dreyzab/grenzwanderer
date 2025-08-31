Grenzwanderer — Location-based RPG (client + Convex backend)

Overview
- Setting: Post-collapse Freiburg. Quests, VN-style scenes, QR points, and a dynamic map.
- Stack: React + Vite, Zustand, Mapbox GL; Convex for backend (mutations/queries + data model).

What’s Included
- Client: UI, map, quests, and a light VN engine with branching scenes.
- Convex: quest registry, progress, player/world state, map points, and helpers.

Recent Changes (highlights)
- Added commitScene mutation (atomic batch of questOps + outcome), with server-only reward math, versioning, and visible points refresh.
- Added client API questsApi.commitScene with bulk quest store hydration, player state hydration, TTL’d visible points cache, and an offline outbox.
- Introduced VN Prologue and Arrival chapter with clean Phase 1 hand-off.
- Added player skills/attributes with simple progression hooks from VN choices.

Running (dev)
- Prereqs: Node 18+, pnpm/npm, Convex CLI.
- Client:
  - cd client
  - npm i
  - npm run dev
- Convex:
  - cd client
  - npx convex dev

Repo Layout
- client/: web client + convex backend code
  - src/: app, entities, features, widgets, shared
  - convex/: convex functions and schema

Notes
- This repository assumes local Convex dev for catalog seeding and APIs.
