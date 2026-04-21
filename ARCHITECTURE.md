# Grenzwanderer Architecture

## Scope

This document defines runtime architecture, content release lifecycle, and repository governance boundaries for Grenzwanderer.

## Runtime Layers

1. Client layer (`src/`)

- React UI and feature modules.
- Reads runtime state from SpacetimeDB subscriptions.
- Calls reducers through generated bindings in `src/module_bindings`.
- App version metadata is injected at build time from `package.json` and git.

2. Backend gameplay layer (`spacetimedb/src/reducers`)

- Core gameplay reducers (`core.ts`, `vn.ts`, `mindpalace.ts`, `ai.ts`).
- Content control reducers (`content.ts`) for publish and rollback.
- Shared helper layer (`reducers/helpers`).

3. Schema layer (`spacetimedb/src/schema.ts`)

- Defines tables and indexes.
- Includes `contentVersion` and `contentSnapshot` tables used for content governance.
- Visibility migration source of truth: `scripts/visibility-matrix.ts`
- Human-readable note: `docs/VISIBILITY_MATRIX.md`

4. Content authoring and extraction layer (`obsidian/`, `scripts/extract-vn-content.ts`)

- Narrative source lives in `obsidian/StoryDetective`.
- Extractor generates `content/vn/pilot.snapshot.json` and the public copy.
- Snapshot carries deterministic checksum metadata.
- Shared authoring/path contract lives in `docs/OBSIDIAN_VN_CONTRACT.md` and `scripts/content-authoring-contract.ts`.
- Repo-backed Freiburg social content lives in `scripts/data/freiburg_social_catalog.ts` and is emitted into `VnSnapshot.socialCatalog`.

## Acceptance Contract

- Supported flow source of truth: `scripts/acceptance-matrix.ts`
- Human-readable usage note: `docs/ACCEPTANCE_MATRIX.md`
- Every supported flow must define:
  - explicit entry path;
  - one smoke command;
  - whether `content:extract`, `content:manifest:check`, and `content:drift:verify` are required.
- `scripts/smoke-all.ts` is derived from the acceptance matrix instead of maintaining its own list.
- Snapshot-backed acceptance flows currently cover Freiburg origin entry, Case01 canonical entry, Case01 mainline, Freiburg dog deduction closure, and the Freiburg social loop.
- The canonical default Freiburg runtime entry is now `case01_hbf_arrival`, which drives Fritz's priority choice and the supported Case01 mainline. `sandbox_case01_pilot` remains snapshot-backed legacy/debug content rather than the supported runtime path.
- Synthetic contract flows cover reducer/runtime authority checks where extracted content is intentionally not required.
- Freiburg is the only supported city in the current player-facing path. Karlsruhe remains explicitly unavailable.

## Visibility Contract

- Public-table decision matrix source of truth: `scripts/visibility-matrix.ts`
- Human-readable note: `docs/VISIBILITY_MATRIX.md`
- Every current `public: true` table must define:
  - one class: `public-by-design`, `player-scoped`, or `operational-private`;
  - current consumer surfaces;
  - one replacement read path or explicit retain-public rationale;
  - one ordered migration wave.
- No raw player-scoped or operational table should flip to private before the replacement read path exists for current supported UI and smoke consumers.
- The visibility decision matrix is already repository-backed and checked in CI/local gates; the next governance follow-up is CI supply-chain hardening.

## Content Release Lifecycle

1. Author or update narrative in `obsidian/`.
2. Build a fresh snapshot with `bun run content:extract`.
3. Validate integrity and drift.
   - `content:drift:verify` is the canonical read-only local artifact consistency check.
   - `content:drift:against-head` is the explicit git-`HEAD` comparison mode.
   - `content:gate:local` is the mutating local gate that regenerates artifacts, runs the Case01 smoke pack, and then verifies the local artifacts.
   - `content:drift:check` remains a deprecated alias to `content:gate:local`.
4. Publish through `bun run content:release -- --version X.Y.Z ...`.
5. Record the release in `content/vn/releases.manifest.json`.
6. Create the matching git tag through `bun run content:tag -- --version X.Y.Z`.
7. Roll back with `bun run content:rollback -- --checksum <sha256> ...` when required.
8. Inspect repo vs DB drift with `bun run content:db:status -- ...` when needed.

Production content publishing remains CLI-only.

## Versioning Policy

- App source of truth: `package.json`
- App tags: `app-vX.Y.Z`
- Content tags: `content-vX.Y.Z+checksum8`
- Runtime UI reads version metadata from compile-time globals injected by Vite.

## CI And Release Topology

- Required quality workflow: `.github/workflows/ci.yml`
- PR title validation workflow: `.github/workflows/semantic-pr.yml`
- PR artifact workflow: `.github/workflows/preview-artifact.yml`
- App release automation: `.github/workflows/release-please.yml`
- Branch protection on `main` must require green `quality` and `validate-title`.

Current scope intentionally excludes production hosting and permanent preview URLs.

## Detectiv0 Migration Boundary

- Runtime and governance are independent in Grenzwanderer.
- Only the documentation bridge remains in `docs/MIGRATION_BRIDGE_DETECTIV0.md`.

## Design Invariants

Four architectural laws govern all content, reducers, and AI contracts.
Full specification with violation examples and compliance checklist: `docs/INVARIANTS.md`.

1. **Deterministic outcomes** – all state mutations are server-authoritative and reproducible.
2. **Fail-forward** – no dead-ends on the critical path; failure adds cost, never a wall.
3. **Core / presentation separation** – reducer logic and AI rendering are independent layers.
4. **AI without agency** – AI suggests, never applies; `suggestedEffects` are display-only.

PRs that touch reducers, content nodes, or AI contracts must pass the invariant compliance checklist.

## Non-Goals In This Phase

- No GitHub Pages deployment.
- No HTTP API versioning rollout.
- No shared runtime coupling with Detectiv0.
- No automated content publish from GitHub Actions.
