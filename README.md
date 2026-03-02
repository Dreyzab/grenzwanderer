# Grenzwanderer

Grenzwanderer is a SpacetimeDB + React project focused on VN runtime, map gameplay, and content-driven progression.

## Prerequisites

- Bun
- SpacetimeDB CLI

## One-command startup (Windows/PowerShell)

```bash
bun run dev:all
```

Keep existing local data (do not clear DB):

```bash
bun run dev:all:keepdb
```

## Local Development

1. Install dependencies:

```bash
bun install
```

2. Start local SpacetimeDB:

```bash
spacetime start
```

3. Publish module to local server:

```bash
bun run spacetime:publish:local:clear
```

4. Regenerate client bindings:

```bash
bun run spacetime:generate
```

5. Start frontend:

```bash
bun run dev
```

## Environment Variables

Create `.env.local` from `.env.example` and set:

- `VITE_SPACETIMEDB_HOST`
- `VITE_SPACETIMEDB_DB_NAME`
- `VITE_MAPBOX_TOKEN`
- `VITE_MAPBOX_STYLE`
- `VITE_ENABLE_AI` (`false` by default)
- `VITE_ENABLE_DEBUG_CONTENT_SEED` (`false` by default; debug-only local seed UI)

## Versioning Model

- App runtime versioning follows semantic tags: `app-vX.Y.Z`.
- Content versioning follows `content-vX.Y.Z+<checksum8>`.
- Content data model stays on existing SpacetimeDB tables/reducers:
  - `content_version`
  - `content_snapshot`
  - `publish_content`
  - `rollback_content`

RU note: основная версия контента теперь всегда semver + checksum suffix, чтобы rollback и коммуникация релизов были однозначными.

## Content Pipeline

1. Extract snapshot from Obsidian source:

```bash
bun run content:extract
```

2. Outputs:

- `content/vn/pilot.snapshot.json`
- `public/content/vn/pilot.snapshot.json`

3. Validate release manifest:

```bash
bun run content:manifest:check
```

## Content Release Runbook

Use CLI only for release/rollback:

```bash
bun run content:release -- --version X.Y.Z --server local --db grezwandererdata
bun run content:rollback -- --checksum <sha256> --server local --db grezwandererdata
```

Manifest path:

- `content/vn/releases.manifest.json`

See detailed operational guide:

- `docs/CONTENT_RELEASE_RUNBOOK.md`

RU note: в production-процессе ручной publish из UI не используется.

## CI Quality Gates

Required checks:

```bash
bun run format:check
bun run lint
bun run test
bun run build
spacetime build --module-path spacetimedb
bun run smoke:all
```

Single release-focused gate:

```bash
bun run quality:release
```

## CI Contract

- Workflow: `.github/workflows/ci.yml`
- `main` must be protected so merges require green `ci`.
- Smoke checks run against local SpacetimeDB in CI after module publish.
- Deploy workflow (`.github/workflows/deploy-pages.yml`) remains separate and should run only after branch protection allows merge.

RU note: branch protection на `main` обязателен, иначе CI-политика не работает как governance-контракт.

## GitHub Pages Deployment

The repo includes `.github/workflows/deploy-pages.yml`.

1. Push repository to GitHub.
2. In **Settings -> Pages**, set **Source** to **GitHub Actions**.
3. Optional variables in **Settings -> Secrets and variables -> Actions -> Variables**:
   - `VITE_BASE_PATH`
   - `VITE_SPACETIMEDB_HOST`
   - `VITE_SPACETIMEDB_DB_NAME`
   - `VITE_ENABLE_AI`

## Additional Docs

- `ARCHITECTURE.md`
- `DOCS_POLICY.md`
- `docs/MIGRATION_BRIDGE_DETECTIV0.md`
- `docs/CONTENT_RELEASE_RUNBOOK.md`
