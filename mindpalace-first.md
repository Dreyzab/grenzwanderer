# MindPalace First (Vertical Slice) Plan

## Overview

Implement Phase 2 Sprint 1 focusing on a Vertical Slice of MindPalace mechanics using Server-Authoritative logic and wipe+reseed migration.

## Project Type

WEB / BACKEND

## Success Criteria

- One MindPalace case playable end-to-end via server reducers.
- Idempotency for critical mutations.
- Zero regression for Phase 0-1.
- Published content operates on schemaVersion=2.

## Tech Stack

- Typescript / React (Client)
- SpacetimeDB (Server)

## File Structure

- `spacetimedb/src/schema.ts`
- `spacetimedb/src/mindpalace.ts`
- `spacetimedb/src/helpers.ts`
- `spacetimedb/src/vn.ts`
- `src/features/mindpalace/*`
- `src/components/AppShell.tsx`

## Task Breakdown

- **Task 1: Schema v2 Definition** (`backend-specialist`): Update content payload to handle cases, facts, hypotheses.
- **Task 2: DB Schema** (`backend-specialist`): Inject MindPalace tables into SpacetimeDB schema.
- **Task 3: Reducers & Helpers** (`backend-specialist`): `start_mind_case`, `discover_fact`, `validate_hypothesis`.
- **Task 4: VN Effects Integration** (`backend-specialist`): Support `discover_fact` inside `record_choice`.
- **Task 5: Telemetry Hooks** (`backend-specialist`): mind_case_started, mind_fact_discovered, mind_hypothesis_validated, mind_case_completed.
- **Task 6: Extractor & Snapshot** (`backend-specialist`): Modify `extract-vn-content.ts` and gen v2 snapshot.
- **Task 7: UI Slicing** (`frontend-specialist`): List facts, build link views, view hypotheses and progress.
- **Task 8: AppShell Connectivity** (`frontend-specialist`): Wire up the UI feature instead of placeholder.

## Phase X: Verification

- Lint: `bun run lint`
- Test: `bun run test`
- Build: `bun run build`
- Compile Spacetime: `spacetime build --module-path spacetimedb`
- Smoke tests: `bun run smoke:phase1` + mindpalace smoke
