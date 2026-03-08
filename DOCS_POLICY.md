# Documentation Policy

## Purpose

Keep architecture, release procedures, environment expectations, and Git/GitHub governance synchronized with the codebase.

## Source Of Truth

- Runtime behavior: `src/` and `spacetimedb/src/`
- App release process: `README.md` and `docs/GIT_RELEASE_GOVERNANCE.md`
- Content release process: `README.md` and `docs/CONTENT_RELEASE_RUNBOOK.md`
- Architecture boundaries: `ARCHITECTURE.md`
- Supported flow acceptance: `scripts/acceptance-matrix.ts` and `docs/ACCEPTANCE_MATRIX.md`
- Migration mapping: `docs/MIGRATION_BRIDGE_DETECTIV0.md`

## Mandatory Documentation Updates

Update docs in the same PR when changing any of:

- reducer contracts (`spacetimedb/src/reducers/**/*.ts`)
- schema tables or indexes (`spacetimedb/src/schema.ts`)
- release and content scripts (`scripts/content-*.ts`)
- build metadata or version wiring (`package.json`, `vite.config.ts`, `src/config.ts`)
- supported flow entry paths or smoke/gate wiring (`src/pages/HomePage.tsx`, `scripts/smoke-*.ts`, `scripts/acceptance-matrix.ts`)
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

5. CI or governance change

- `README.md`
- `docs/GIT_RELEASE_GOVERNANCE.md`
- this file if the documentation rule itself changes

6. Detectiv0 parity or migration update

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
