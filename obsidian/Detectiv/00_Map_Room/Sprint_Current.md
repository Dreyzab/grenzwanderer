---
id: sprint_current
tags:
  - type/sprint
  - status/developing
---

# Sprint Current

## Focus

- Start Mirror Protocol Phase 3 (Polish + Persistence).
- Keep newly expanded content stable while hardening persistence contracts.
- Keep `Narrative` truth in Obsidian and `Systems` truth in code.

## Phase Status (Mirror Protocol)

- [x] Phase 1.1 `Technical Debt Cleanup` complete (VN contract, data normalization, ID hardening).
- [x] Phase 2 `Content + Systems Expansion` complete (current sprint scope).
- [~] Phase 3 `Polish + Persistence` in progress (inventory persistence slice).

## Checklist

- [x] Add consumable gameplay effects and verify state deltas in runtime + docs.
- [x] Integrate quest-stage gating in VN branching and world progression.
- [x] Add stage timeline visibility in Quest Journal/Quest Log with transition rationale popover.
- [x] Expand route network beyond starter links and document district rules.
- [x] Link merchant variants to character roles and economy loop notes.
- [x] Surface secrets/evolution progression in dossier-facing UX.
- [x] Add inventory snapshot persistence (`/inventory/snapshot`) and wire web hydrate/sync flow.

## Implemented (Engine Foundation)

- [x] Added `/engine` module with world snapshot, action-tick time, travel start/complete, case advance, progression apply, and evidence discover.
- [x] Added night-bank gating with alternative approaches (`lockpick`, `bribe`, `warrant`).
- [x] Added travel beat support (`intel_audio`, `street_rumor`) for movement-as-gameplay.
- [x] Added evidence contradiction support via `contradicts_id`.
- [x] Added integration tests: `apps/server/test/modules/engine.test.ts`.
- [x] Added auth-aware user resolution (`auth -> headers -> fallback`) for map/engine/detective modules.
- [x] Replaced hardcoded point-objective mapping with dynamic location-driven routing.

## Implemented (Phase 1 Hardening)

- [x] VN scene preconditions are enforced at runtime.
- [x] Passive checks and `passiveFailText` path are preserved in runtime logic merge.
- [x] Scene `onEnter` execution protected from duplicate application.
- [x] Canonical Parliament IDs normalized in shared runtime data.
- [x] Shared item registry introduced for inventory/merchant data alignment.
- [x] Map/location ID conventions normalized to prevent unlock mismatches.

## Implemented (Phase 2 Quest Flow Slice)

- [x] Added canonical quest stage registry and progression helpers in shared data.
- [x] Extended VN condition context with `questStages`, `isQuestAtStage`, `isQuestPastStage`.
- [x] Added `set_quest_stage` action support in VN and map action handlers.
- [x] Extended map resolver DSL with `quest_stage` and `quest_past_stage`.
- [x] Updated Case 01 quest model with stage transitions metadata (`flags/actions` rationale).
- [x] Added stage-aware objective filtering and stage timeline to Quest Journal.
- [x] Added compact stage timeline to Quest Log.
- [x] Replaced native title hints with interactive stage popover (hover/focus/click + mobile tap).
- [x] Expanded `city_routes` seed graph to include leads and industrial links under `loc_*` IDs.
- [x] Added district rules doc + runtime soft gate for night access in `stuhlinger`.
- [x] Added merchant variants (`apothecary_shop`, `tailor_shop`, `pub_keeper`, gated `the_fence`) in shared registry.
- [x] Linked map points to merchant actions via `open_trade` bindings on location nodes.
- [x] Added role/access/economy metadata and documented economy loop integration.
- [x] Added `Psyche Profile` tab in dossier-facing Character Page with:
  - faction alignment signalization,
  - knowledge registry for unlocked secrets,
  - evolution tracks (case + companion arcs),
  - field-check reliability summary.
- [x] Migrated UI localization to `react-i18next` with JSON namespaces and `LanguageSwitcher` in Navbar.

## Implemented (Phase 3 Persistence Slice)

- [x] Added server module `inventory` with:
  - `GET /inventory/snapshot` (load + starter fallback),
  - `POST /inventory/snapshot` (persist money/items snapshot).
- [x] Added server module `quests` with:
  - `GET /quests/snapshot` (load persisted quest states),
  - `POST /quests/snapshot` (replace quest snapshot with normalized payload).
- [x] Added server module `dossier` with:
  - `GET /dossier/snapshot` (load normalized detective dossier snapshot),
  - `POST /dossier/snapshot` (persist sanitized dossier payload).
- [x] Added `user_inventory_snapshots` schema in server Drizzle models.
- [x] Added additive migration `apps/server/drizzle/0004_lovely_mastermind.sql` for inventory snapshots rollout.
- [x] Added additive migration `apps/server/drizzle/0005_shiny_plazm.sql` for `user_quests.stage` and `user_quests.completed_objective_ids`.
- [x] Added additive migration `apps/server/drizzle/0006_magenta_satana.sql` for `user_dossier_snapshots`.
- [x] Added typed inventory contracts in `packages/contracts/inventory.ts`.
- [x] Added typed quest contracts in `packages/contracts/quests.ts`.
- [x] Added typed dossier contracts in `packages/contracts/dossier.ts`.
- [x] Wired web API client (`api.inventory.snapshot`) and inventory store hydration/sync actions.
- [x] Wired web API client (`api.quests.snapshot`) and quest store hydration/sync actions.
- [x] Wired web API client (`api.dossier.snapshot`) and dossier store hydration/sync actions.
- [x] Enabled inventory hydration at app boot (`App.tsx`) so merchant/map flows persist without opening Inventory page.
- [x] Enabled dossier hydration at app boot (`App.tsx`) with safe local fallback sync.
- [x] Updated `useQuestEngine` boot order: hydrate quest snapshot first, then auto-start `case01` if missing.
- [x] Added controlled integration test: `apps/server/test/modules/inventory.test.ts`.
- [x] Added controlled integration test: `apps/server/test/modules/quests.test.ts`.
- [x] Added controlled integration test: `apps/server/test/modules/dossier.test.ts`.
