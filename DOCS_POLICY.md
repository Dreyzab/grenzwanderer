# Documentation Policy

## Purpose

Keep architecture, release procedures, environment expectations, and Git/GitHub governance synchronized with the codebase.

- **P0 Baseline Freeze (2026-05-09)**: Documents must reflect the "Freiburg-only" supported scope. Karlsruhe-related documentation is maintained for migration history but is not part of the active quality gate.

## Source Of Truth

- Runtime behavior: `src/` and `spacetimedb/src/`
- App release process: `README.md` and `docs/GIT_RELEASE_GOVERNANCE.md`
- Content release process: `README.md` and `docs/CONTENT_RELEASE_RUNBOOK.md`
- Architecture boundaries: `ARCHITECTURE.md`
- Supported flow acceptance: `scripts/acceptance-matrix.ts` and `docs/ACCEPTANCE_MATRIX.md`
- AI runtime scope: `src/features/ai/contracts.ts`, `spacetimedb/src/reducers/ai*.ts`, `scripts/ai-worker-watch.ts`, and `ARCHITECTURE.md`
- Migration mapping: `docs/MIGRATION_BRIDGE_DETECTIV0.md`

## State Separation Policy

- **Content State:** Defined by `content/vn/*.snapshot.json`, `content/vn/releases.manifest.json`, and authoritative SpacetimeDB table snapshots. These are treated as _data artifacts_ that follow a release/rollback lifecycle.
- **Code & Architecture State:** Defined by `src/`, `spacetimedb/src/`, `ARCHITECTURE.md`, and `ACCEPTANCE_MATRIX.md`. These follow standard git branching and logic-driven quality gates.
- **Rule:** Content state changes must not introduce breaking changes to the current `acceptance-matrix.ts` runtime contract without a synchronized code update.

## Mandatory Documentation Updates

Update docs in the same PR when changing any of:

- reducer contracts (`spacetimedb/src/reducers/**/*.ts`)
- schema tables or indexes (`spacetimedb/src/schema.ts`)
- release and content scripts (`scripts/content-*.ts`)
- build metadata or version wiring (`package.json`, `vite.config.ts`, `src/config.ts`)
- supported flow entry paths or smoke/gate wiring (`src/pages/HomePage.tsx`, `scripts/smoke-*.ts`, `scripts/acceptance-matrix.ts`)
- supported AI queue kinds, AI response schemas, or worker completion semantics (`src/features/ai/contracts.ts`, `spacetimedb/src/reducers/ai*.ts`, `scripts/ai-worker-watch.ts`)
- CI, PR, or release workflows (`.github/workflows/*.yml`)
- release automation config (`.release-please*.json`)
- content extraction contract (`scripts/extract-vn-content.ts`)

## Minimum Docs To Touch By Change Type

1. Content release or rollback logic change

- `README.md`
- `docs/CONTENT_RELEASE_RUNBOOK.md`
- `docs/GIT_RELEASE_GOVERNANCE.md` if git tagging flow changes
- `ARCHITECTURE.md` if lifecycle or data flow changes

2. App release or versioning change

- `README.md`
- `docs/GIT_RELEASE_GOVERNANCE.md`
- `CHANGELOG.md` if behavior changed outside automated release flow bootstrap

3. Schema or reducer contract change

- `ARCHITECTURE.md`
- operational runbooks if release behavior changes

4. Supported flow, entry-path, or smoke gate change

- `README.md`
- `ARCHITECTURE.md`
- `docs/ACCEPTANCE_MATRIX.md`
- this file

5. Supported AI queue kind or AI output contract change

- `README.md`
- `ARCHITECTURE.md`
- `docs/ACCEPTANCE_MATRIX.md` if smoke coverage changes
- `docs/INVARIANTS.md` if the display-only boundary changes

6. CI or governance change

- `README.md`
- `docs/GIT_RELEASE_GOVERNANCE.md`
- this file if the documentation rule itself changes

7. Detectiv0 parity or migration update

- `docs/MIGRATION_BRIDGE_DETECTIV0.md`

## Language Policy

- Primary documentation language: English.
- Add short RU operational notes only where failure risk is high.

## Changelog Rule

- `CHANGELOG.md` is the app-release changelog and is owned by release automation after the `0.2.0` baseline.
- Manual changelog edits are allowed only for bootstrap or to repair a broken automated release entry.

## Ownership

- Engineering owner: runtime, CI, release, and governance docs.
- Narrative and content owner: source narrative docs and content-runbook references.
