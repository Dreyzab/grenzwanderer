# Obsidian VN Contract

This document defines the minimum authoring contract that the VN extractor and coverage checks assume.

For writer-facing tone, atmosphere, and scene review language, see
[Atmosphere Bible](./ATMOSPHERE_BIBLE.md). It is editorial guidance only:
it does not add parsed frontmatter, runtime schema, snapshot fields, or reducer
requirements.

## Vault Roots

- Runtime narrative vault root is fixed at `obsidian/StoryDetective`.
- Design and planning documentation lives in `obsidian/Detectiv`.
- Only `obsidian/StoryDetective` is used as the canonical VN extraction source;
  `obsidian/Detectiv` may reference runtime concepts but is not parsed into
  snapshots.
- Case01 onboarding root is fixed at `40_GameViewer/Case01/Plot/01_Onboarding`.
- Authoritative Obsidian VN runtime scenarios are discovered by `_scenario.md`
  files under `obsidian/StoryDetective`.
- Supported Case01 runtime nodes must either have exact StoryDetective
  frontmatter `id` coverage under `40_GameViewer/Case01` or belong to the
  explicit `temporary_runtime_bridge` scenario list in
  `scripts/content-authoring-contract.ts`.
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
- `src/features/map/data/generated-static-points.ts` is an authoring-side mirror generated from the extracted snapshot (consumed by authoring scripts and the Case01 smoke pack); the runtime map reads exclusively from the active content snapshot — there is no client-side fallback map source.
- `tmp/vn-obsidian-migration-report.json` records ownership, locale, and dual-run
  diagnostics for Obsidian runtime scenarios.
- `obsidian/StoryDetective/40_GameViewer/Case01/CASE01_CANON_LEDGER.md`
  records the writer-facing Case01 scene ledger, bridge status, and Elias
  Thorne preservation policy.
- Atmosphere tags and the Grill Gate from `ATMOSPHERE_BIBLE.md` are
  writer-facing review vocabulary, not extractor-enforced runtime fields.
