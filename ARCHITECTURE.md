# Grenzwanderer Architecture

## Scope

This document defines runtime architecture, content release lifecycle, and repository governance boundaries for Grenzwanderer.

## Governance: P0 Baseline Freeze

The project follows a "Snapshot-First" governance model for narrative content:

- **Baseline**: `content-v0.1.0` is the authoritative P0 freeze.
- **Scope**: Only Freiburg (Case 01) is supported in the default acceptance path. Karlsruhe assets remain outside the supported Freiburg release gate until they have their own accepted matrix entry and smoke coverage.
- **Verification**: `bun run content:drift:verify` ensures code-backed data matches extracted snapshots.

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

4. Internationalization layer (`src/features/i18n`)

- `I18nProvider` manages UI language state and dynamic locale loading.
- Locales are stored as JSON chunks in `src/features/i18n/locales/`.
- Narrative content is resolved via stable content IDs (e.g., `vn.scenarioId.nodeId.body`) to decouple logic from translation.
- Fallback to canonical English content is enforced for missing translations.

5. Content authoring and extraction layer (`obsidian/`, `scripts/extract-vn-content.ts`)

- Canonical runtime narrative source lives in `obsidian/StoryDetective`.
- Design and planning documentation lives in `obsidian/Detectiv` and is not a
  snapshot extraction source.
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
- **P0 Baseline (2026-05-09)**: The matrix currently defines **16 authoritative flows** (4 runtime contracts, 12 player flows).
- Snapshot-backed acceptance flows cover Freiburg origin entry, Case01 canonical entry, Case01 mainline, Freiburg dog deduction closure, and the Freiburg social loop.
- The canonical default Freiburg runtime entry is now `case01_hbf_arrival`, which drives Fritz's priority choice and the supported Case01 mainline. `sandbox_case01_pilot` remains snapshot-backed legacy/debug content rather than the supported runtime path.
- Synthetic contract flows cover reducer/runtime authority checks and the AI queue contract where extracted content is intentionally not required.
- Freiburg is the only supported city in the current player-facing path. Karlsruhe remains explicitly unavailable.

## AI Runtime Contract

- Supported AI queue kinds are `generate_dialogue`, constrained `generate_character_reaction`, and constrained `propose_director_step`.
- `generate_dialogue` renders additive inner-thought lines for deterministic skill-check outcomes.
- `generate_character_reaction` renders display-only NPC reaction proposals from current scene context, visible facts, and trust/disposition snapshots.
- `propose_director_step` is the v1 narrative director: auto-enqueued on VN node entry (no free player input in v1), presentation-only, emitting one of `framing | next_beat_hint | soft_detour` plus a `suggestedReturnBeatId` drawn from the authored Case01 allowed-beat union built by `buildDirectorAllowedBeatIds` (active snapshot scenarios plus the temporary runtime bridge fallback in `CASE01_DIRECTOR_BRIDGE_FALLBACK_BEAT_IDS`). The director request layer enforces a 60-second cooldown and per-(player, scenario, node) dedupe inside the SpacetimeDB reducer, and the engine also rejects director proposals whose `suggestedReturnBeatId` is not in the original request's allowed list. Director v1 has its own `VITE_ENABLE_AI_DIRECTOR` flag and operates only over the existing Freiburg Case01 mainline; it never starts transitions, mutates flags/vars/quests/trust, or asserts new world facts. Bounded detours with reducer-side acceptance, fortune/providence costs, and director state tables are deferred to later increments.
- AI output never mutates server state. `suggestedEffects`, `revealHintFactId`, and `bridgeText` are inert metadata unless future authored reducer logic explicitly consumes a separate, deterministic command.
- The worker requests Gemini JSON with `responseMimeType: "application/json"` and `responseJsonSchema`, then validates semantics locally before completing an AI request. For `propose_director_step` the worker rejects proposals whose `suggestedReturnBeatId` is not in the request's allowed beat list, surfacing a retryable malformed-JSON failure.

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
