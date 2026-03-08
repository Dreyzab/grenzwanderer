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

4. Content authoring and extraction layer (`obsidian/`, `scripts/extract-vn-content.ts`)

- Narrative source lives in `obsidian/StoryDetective`.
- Extractor generates `content/vn/pilot.snapshot.json` and the public copy.
- Snapshot carries deterministic checksum metadata.

## Acceptance Contract

- Supported flow source of truth: `scripts/acceptance-matrix.ts`
- Human-readable usage note: `docs/ACCEPTANCE_MATRIX.md`
- Every supported flow must define:
  - explicit entry path;
  - one smoke command;
  - whether `content:extract`, `content:manifest:check`, and `content:drift:check` are required.
- `scripts/smoke-all.ts` is derived from the acceptance matrix instead of maintaining its own list.
- Snapshot-backed acceptance flows currently cover Freiburg entry/handoff, Freiburg case slice, and Freiburg dog deduction closure.
- Synthetic contract flows cover reducer/runtime authority checks where extracted content is intentionally not required.

## Content Release Lifecycle

1. Author or update narrative in `obsidian/`.
2. Build a fresh snapshot with `bun run content:extract`.
3. Validate integrity and drift.
4. Publish through `bun run content:release -- --version X.Y.Z ...`.
5. Record the release in `content/vn/releases.manifest.json`.
6. Create the matching git tag through `bun run content:tag -- --version X.Y.Z`.
7. Roll back with `bun run content:rollback -- --checksum <sha256> ...` when required.

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

## Non-Goals In This Phase

- No GitHub Pages deployment.
- No HTTP API versioning rollout.
- No shared runtime coupling with Detectiv0.
- No automated content publish from GitHub Actions.
