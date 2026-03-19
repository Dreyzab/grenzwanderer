# Grenzwanderer

Grenzwanderer is a private SpacetimeDB + React project focused on VN runtime, map gameplay, and content-driven progression.

Current supported player-facing city: Freiburg. Karlsruhe remains intentionally unavailable in the supported flow set.

## Toolchain

- Bun `1.3.3`
- SpacetimeDB CLI `2.0.1`

## Local Development

1. Install dependencies:

```bash
bun install
```

2. Create `.env.local` from `.env.example`.

3. Start local SpacetimeDB:

```bash
spacetime start
```

4. Publish the module to the local database:

```bash
bun run spacetime:publish:local:clear
```

5. Regenerate client bindings when backend contracts change:

```bash
bun run spacetime:generate
```

6. Start the frontend:

```bash
bun run dev
```

Windows shortcut:

```bash
bun run dev:all
```

Keep existing local DB data:

```bash
bun run dev:all:keepdb
```

## Environment Variables

Set only the variables used by this repo:

- `VITE_SPACETIMEDB_HOST`
- `VITE_SPACETIMEDB_DB_NAME`
- `VITE_MAPBOX_TOKEN`
- `VITE_MAPBOX_STYLE`
- `VITE_ENABLE_AI`
- `VITE_ENABLE_DEBUG_CONTENT_SEED`

## Versioning Model

- App release source of truth: `package.json`
- App git tags: `app-vX.Y.Z`
- Content git tags: `content-vX.Y.Z+checksum8`
- Runtime build metadata is injected at build time:
  - `__APP_VERSION__`
  - `__APP_COMMIT_SHA__`
  - `__APP_BUILD_TIMESTAMP__`

## Quality Gates

Local baseline:

```bash
bun run lint
bun run test
bun run build
spacetime build --module-path spacetimedb
```

Release-focused gate:

```bash
bun run quality:release
```

Content-heavy gate:

```bash
bun run quality:loop-poc
```

## Acceptance Matrix

Supported flow source of truth:

- `scripts/acceptance-matrix.ts`

Inspect the current matrix:

```bash
bun run acceptance:matrix
```

Snapshot-backed supported flows must pass these content gates before smoke execution:

```bash
bun run content:extract
bun run content:manifest:check
bun run content:obsidian:coverage:check
bun run content:map:metrics:check
bun run content:drift:check
```

With local SpacetimeDB running and the module published, execute the supported smoke pipeline:

```bash
bun run smoke:all
```

`smoke:all` is derived from the acceptance matrix. Synthetic contract flows in the matrix explicitly mark extract/manifest/drift gates as `n/a`.
The Freiburg social loop is covered through `smoke:social-access`, `smoke:rumor-verification`, `smoke:agency-career`, and `smoke:service-unlock`.
The canonical journalist onboarding path is now wakeup-first: `journalist_agency_wakeup -> sandbox_agency_briefing`. `intro_journalist` remains in the snapshot for legacy/debug coverage only.

## SpacetimeDB Visibility Matrix

Public-table decision matrix source of truth:

- `scripts/visibility-matrix.ts`
- `docs/VISIBILITY_MATRIX.md`

Inspect the current matrix:

```bash
bun run governance:visibility:matrix
```

Validate matrix coverage against the current schema:

```bash
bun run governance:visibility:check
```

This inventory classifies every current `public: true` table as `public-by-design`, `player-scoped`, or `operational-private` and records the required replacement read path before any visibility flip.
The visibility matrix is already landed. The next governance follow-up is CI supply-chain hardening, not another reducer-auth baseline pass.

## Git And PR Flow

- Default branch: `main`
- Branching model: trunk-based
- Branch naming:
  - `feat/<slug>`
  - `fix/<slug>`
  - `chore/<slug>`
  - `docs/<slug>`
  - `refactor/<slug>`
  - `test/<slug>`
  - `ci/<slug>`
- Merge policy: squash only
- PR titles must follow Conventional Commits:
  - `feat(scope): summary`
  - `fix(scope): summary`
  - `chore(scope): summary`
  - `docs(scope): summary`
  - `refactor(scope): summary`
  - `test(scope): summary`
  - `ci(scope): summary`
  - `build(scope): summary`

## GitHub Workflows

- `CI`: required quality workflow on `main` and PRs
- `Semantic PR`: validates PR titles
- `PR Preview Artifact`: builds `dist` and uploads a PR artifact
- `Release Please`: manages automated app release PRs and tags

This phase intentionally does not deploy to production hosting. Preview artifacts are review artifacts, not live preview URLs.

## App Release Flow

1. Merge regular work into `main` through green PRs only.
2. `Release Please` opens or updates the release PR.
3. Merge the release PR to:
   - bump `package.json` version;
   - update `CHANGELOG.md`;
   - create a GitHub Release;
   - create the git tag `app-vX.Y.Z`.

Bootstrap note for a fresh GitHub remote:

```bash
git tag -a app-v0.2.0 -m "Governed release baseline 0.2.0"
git push origin app-v0.2.0
```

Create that baseline tag immediately after pushing the governance setup to GitHub for the first time.

## Content Release Flow

1. Extract content:

```bash
bun run content:extract
```

2. Validate content integrity:

```bash
bun run content:manifest:check
bun run content:obsidian:coverage:check
bun run content:map:metrics:check
bun run content:drift:check
```

`content:drift:check` rewrites generated snapshot artifacts because it runs `content:extract` internally.

3. Publish content:

```bash
bun run content:release -- --version X.Y.Z --server local --db grezwandererdata
```

4. Create the corresponding git tag:

```bash
bun run content:tag -- --version X.Y.Z
git push origin content-vX.Y.Z+checksum8
```

5. Roll back when needed:

```bash
bun run content:rollback -- --checksum <sha256> --server local --db grezwandererdata
```

Detailed operational procedure:

- `docs/CONTENT_RELEASE_RUNBOOK.md`
- `docs/GIT_RELEASE_GOVERNANCE.md`

## Manual GitHub Setup

These steps cannot be completed locally without the target GitHub repo URL and permissions:

1. Add the private GitHub remote:

```bash
git remote add origin <github-private-repo-url>
git push -u origin main
```

2. Enable Actions.
3. Enable squash merges and auto-delete merged branches.
4. Protect `main` with:
   - pull request required;
   - 1 approval minimum;
   - stale approval dismissal;
   - up-to-date branches required;
   - conversation resolution required;
   - force-push disabled;
   - branch deletion disabled;
   - required checks `quality` and `validate-title`.

## Additional Docs

- `ARCHITECTURE.md`
- `DOCS_POLICY.md`
- `docs/ACCEPTANCE_MATRIX.md`
- `docs/GIT_RELEASE_GOVERNANCE.md`
- `docs/CONTENT_RELEASE_RUNBOOK.md`
- `docs/MIGRATION_BRIDGE_DETECTIV0.md`
