# Migration Bridge: Detectiv0 -> Grenzwanderer

Last updated: 2026-04-08

## Intent

Grenzwanderer is runtime-independent from Detectiv0. This bridge preserves migration context and parity tracking only.

## Parity Matrix

| Area                | Detectiv0                        | Grenzwanderer                                        | Status              | Notes                                                 |
| ------------------- | -------------------------------- | ---------------------------------------------------- | ------------------- | ----------------------------------------------------- |
| Runtime backend     | Custom API + services            | SpacetimeDB reducers/tables                          | Diverged by design  | No runtime coupling                                   |
| Narrative source    | Obsidian vault                   | Obsidian vault + extractor                           | Partial parity      | Runtime/snapshot canon now prefers Case01-first flow  |
| Content versioning  | Mixed/manual flows               | `content_version` + `content_snapshot` + CLI release | Improved            | Semver+checksum policy                                |
| CI quality gates    | Present                          | Added in `ci.yml`                                    | Aligned             | Branch protection required                            |
| Acceptance matrix   | Mixed docs + runtime habits      | `scripts/acceptance-matrix.ts` + smoke pipeline      | Improved            | Entry paths and content gates are explicit            |
| Supported city path | Mixed regional experiments       | Freiburg only; Karlsruhe intentionally unavailable   | Explicitly narrowed | Karlsruhe needs its own smoke-backed acceptance entry |
| Deploy              | Cloud Run + Firebase (Detectiv0) | No production hosting in current phase               | Out of scope        | Preview artifacts are review-only                     |
| Docs governance     | Existing policy                  | `DOCS_POLICY.md` + architecture/runbook set          | Aligned by intent   | EN primary + RU operational notes                     |

## Explicit Non-Ported Items

- Detectiv0 runtime services and API endpoint contracts.
- Detectiv0 cloud deployment topology.
- Legacy action handlers that do not map to current reducers.

## Ported/Adapted Concepts

- Quality gate philosophy (lint/test/build/smoke as release gate).
- Governance documentation discipline.
- Narrative-first content authoring workflow.

## Ongoing Bridge Rule

When a Detectiv0-origin concept is adopted, add:

1. Source reference (component/service/doc)
2. Grenzwanderer destination path
3. Adaptation notes and rationale

## Canon Identity Rule

- Runtime/display canon wins when Detectiv design material disagrees with supported runtime content.
- Detectiv aliases must be marked as `design/reference` until they are migrated into runtime canon.
- Current Case01 identity policy is documented in `docs/CASE01_CANON_IDENTITY.md`.

RU note: этот документ нужен для прозрачности миграции, а не для связывания runtime двух проектов.
