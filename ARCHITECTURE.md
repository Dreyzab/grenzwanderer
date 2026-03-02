# Grenzwanderer Architecture

## Scope

This document defines runtime architecture, content release lifecycle, and integration boundaries for Grenzwanderer.

## Runtime Layers

1. Client layer (`src/`)

- React UI and feature modules.
- Reads runtime state from SpacetimeDB subscriptions.
- Calls reducers through generated bindings (`src/module_bindings`).

2. Backend gameplay layer (`spacetimedb/src/reducers`)

- Core gameplay reducers (`core.ts`, `vn.ts`, `mindpalace.ts`, `ai.ts`).
- Content control reducers (`content.ts`) for publish and rollback.
- Shared helper layer (`reducers/helpers`).

3. Schema layer (`spacetimedb/src/schema.ts`)

- Defines tables and indexes.
- Includes `contentVersion` and `contentSnapshot` tables used for content governance.

4. Content authoring/extraction layer (`obsidian/`, `scripts/extract-vn-content.ts`)

- Narrative source lives in `obsidian/StoryDetective`.
- Extractor generates `content/vn/pilot.snapshot.json` and public copy.
- Snapshot carries deterministic checksum.

## Content Release Lifecycle

1. Author/update narrative in `obsidian/`.
2. Build snapshot:

- `bun run content:extract`

3. Release by CLI:

- `bun run content:release -- --version X.Y.Z ...`

4. Reducer `publish_content`:

- deactivates previous active version (or resets state on schema migration),
- stores snapshot row by checksum,
- activates content version row,
- syncs dependent content tables.

5. Rollback by CLI:

- `bun run content:rollback -- --checksum <sha256> ...`
- reducer `rollback_content` re-activates target checksum.

RU note: production release flow идет только через CLI и фиксируется в `content/vn/releases.manifest.json`.

## Versioning Policy

- App tags: `app-vX.Y.Z`
- Content tags: `content-vX.Y.Z+checksum8`
- Content release record is stored in `content/vn/releases.manifest.json`.

## CI/CD Topology

- Quality workflow: `.github/workflows/ci.yml`
- Deploy workflow: `.github/workflows/deploy-pages.yml`
- Branch protection on `main` must require green `ci` before merge.

## Detectiv0 Migration Boundary

- Runtime and governance are independent in Grenzwanderer.
- Only documentation bridge remains:
- `docs/MIGRATION_BRIDGE_DETECTIV0.md`

## Non-Goals (current phase)

- No HTTP API versioning rollout.
- No shared runtime coupling with Detectiv0.
