# Acceptance Matrix

Authoritative source of truth for supported flows lives in `scripts/acceptance-matrix.ts`.

Inspect the current matrix with:

```bash
bun run acceptance:matrix
```

A flow is considered supported in this repository only when all of the following are true:

1. The flow exists in `scripts/acceptance-matrix.ts`.
2. The entry path is explicit enough to reproduce the runtime handoff.
3. The referenced smoke command exists in `package.json`.
4. The content gate profile is explicit:
   - snapshot-backed flow: `content:extract`, `content:manifest:check`, `content:drift:verify`
   - synthetic contract flow: snapshot gates are `n/a`

Do not hand-maintain a second matrix in docs. Update the script first, then sync `README.md`, `ARCHITECTURE.md`, `DOCS_POLICY.md`, and `docs/MIGRATION_BRIDGE_DETECTIV0.md` when the supported flow set changes.

Current supported player-facing scope is Freiburg only. Karlsruhe is still outside the supported flow set until it has its own matrix entry and smoke coverage.

> [!NOTE]
> **P0 Baseline Freeze (2026-05-09)**: The generated matrix currently reports 15 supported flows: 3 runtime contracts and 12 player flows. Any drift reported by the manifest, map metrics, or snapshot consistency gates is a blocking quality failure.

Do not copy the generated table into this document. Run `bun run acceptance:matrix` for the exact current flow ids, entry paths, smoke commands, and gate profile.

Current P0 summary:

- Runtime authority contracts cover VN, map, and battle reducer/runtime behavior.
- Freiburg player-facing coverage includes origin entry, Case01 entry/mainline/branches, banker duel, dog deduction, and the social loop.
- Freiburg social coverage includes social access, rumor verification, agency career progression, and service unlock.
- Inner Parliament D1 is covered through the Freiburg train moral choice, server-authoritative voice rank, leader-gated follow-up, and Mind Palace fact bridge.
- Mind Palace remains covered as a synthetic contract loop with snapshot gates marked `n/a`.
