Grenzwanderer Client — Overview

Summary
- Location-based RPG client with VN-style scenes, quests, and a dynamic map powered by Mapbox GL. Backend by Convex.

Key Modules
- Convex API: quest registry/progress, player/world state, map points, helpers.
- VN Engine: simple scene/choice model with inline actions and map triggers.
- State: Zustand stores for player, quests, progression; Convex for persistence.

Recent Additions
- Atomic scene commit (commitScene):
  - Args: { deviceId (server), questOps[], outcome (whitelisted), rewardHint?, playerVersion?, progressVersion?, opSeq? }.
  - Server-only rewards via rewardHint (no raw credits/fame from client).
  - Returns: { playerState, progress, availableQuests, visiblePoints, version, ttlMs }.
- Client commitScene helper:
  - Hydrates quest store via applyBatch; hydrates player/progression; caches visiblePoints with TTL+version.
  - Offline outbox: queues commits and replays with opSeq on reconnect.
- Map visible points cache:
  - useGameDataStore.serverVisiblePoints = { points, version, ttlMs, updatedAt }.
  - useClientVisiblePoints prefers fresh server cache, falls back to local derivation otherwise.
- VN content:
  - Prologue + Arrival (sensory overload → control → bureau → PDA grant).
  - Clean Phase 1 hand-off via go_to_map_with_dialog + dialogKey='phase_1_choice_dialog'.
- Player skills/attributes:
  - skillsLevels: logic, empathy, cynicism, authority, paranoia, intuition, technophile, encyclopedia, reflexes, endurance, dopamine, philosophy.
  - attributes: strength, endurance, reflexes, perception, charisma.
  - VN choices setFlags that increment skills and set meaningful flags.

Developer Notes
- Convex dev: run `npx convex dev` from client/ for mutations and schema.
- Client dev: `npm run dev` in client/.
- Seeding: see convex helpers and seed mutations (dev-only tokens recommended).

Phase 1 Transition
- The final PDA grant scene triggers go_to_map_with_dialog with dialogKey='phase_1_choice_dialog'.
- Client calls questsApi.commitScene({ outcome: { setPhase: 1 } }) and navigates to map.

Security
- commitScene outcome fields are whitelisted server-side (no client-supplied raw economy deltas).
- rewardHint maps to server-side fame/credits updates.
