# Documentation Policy

## Purpose

Keep architecture, release procedures, and migration context synchronized with code and content changes.

## Source of Truth

- Runtime behavior: code in `src/` and `spacetimedb/src/`.
- Release procedures: `README.md` + `docs/CONTENT_RELEASE_RUNBOOK.md`.
- Migration mapping: `docs/MIGRATION_BRIDGE_DETECTIV0.md`.

## Mandatory Documentation Updates

Update docs in the same PR when changing any of:

- reducer contracts (`spacetimedb/src/reducers/**/*.ts`)
- schema tables/indexes (`spacetimedb/src/schema.ts`)
- release scripts (`scripts/content-*.ts`)
- CI policy (`.github/workflows/*.yml`)
- content extraction contract (`scripts/extract-vn-content.ts`)

## Minimum Docs to Touch by Change Type

1. Content release or rollback logic change

- `README.md`
- `docs/CONTENT_RELEASE_RUNBOOK.md`
- `ARCHITECTURE.md` (if lifecycle/data flow changed)

2. Schema or reducer contract change

- `ARCHITECTURE.md`
- runbook if operational behavior changed

3. CI or governance change

- `README.md` (CI Contract section)
- this file (`DOCS_POLICY.md`) if process rules changed

4. Detectiv0 parity/migration update

- `docs/MIGRATION_BRIDGE_DETECTIV0.md`

## Language Policy

- Primary language: English.
- Critical operational notes: add short RU note blocks where failure risk is high.

## Changelog Rule

When behavior changes (not pure refactor), add an entry to `CHANGELOG.md`:

- what changed
- why
- impact/risk
- rollback note if relevant

## Ownership

- Engineering owner: updates runtime/CI docs.
- Narrative/content owner: updates source narrative docs and content-runbook references.

RU note: если изменение влияет на релиз контента, PR без обновления runbook считается неполным.
