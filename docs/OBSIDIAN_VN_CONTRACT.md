# Obsidian VN Contract

This document defines the minimum authoring contract that the VN extractor and coverage checks assume.

## Vault Roots

- Narrative vault root is fixed at `obsidian/StoryDetective`.
- Case01 onboarding root is fixed at `40_GameViewer/Case01/Plot/01_Onboarding`.
- Authoritative Obsidian VN runtime scenarios are discovered by `_scenario.md`
  files under the vault.
- Do not rename or move these roots without updating `scripts/content-authoring-contract.ts`.

## Required Frontmatter

- Every parsed markdown node must include non-empty `id`.
- Every parsed markdown node must include non-empty `type`.
- `vn_checks` documents must define `parent`.
- Runtime-adjacent `vn_*` types outside the supported set are rejected.
- `_scenario.md` must define `id`, `title`, `start_node_id`, and `scene_order`.
- Canonical runtime scenes must define `id`, `type: vn_scene`, `status`,
  `## Script`, and a fenced `vn-logic` block.
- Locale scene files may localize text only; runtime logic in locale files is a
  build error.

## Operational Notes

- `content:extract` is the only command that should rewrite snapshot artifacts.
- `content:drift:verify` is read-only and checks that the local snapshot artifacts agree with each other after normalization.
- `content:drift:against-head` is the explicit git-`HEAD` comparison command for release-baseline work.
- `content:gate:local` is the intended local convenience gate when authoring content and includes the Case01 smoke pack before verification.
- Supported Freiburg fallback map data is generated from the extracted snapshot into `src/features/map/data/generated-static-points.ts`; do not hand-maintain a second Freiburg player-facing map source.
- `tmp/vn-obsidian-migration-report.json` records ownership, locale, and dual-run
  diagnostics for Obsidian runtime scenarios.
