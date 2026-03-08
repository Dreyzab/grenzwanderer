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
   - snapshot-backed flow: `content:extract`, `content:manifest:check`, `content:drift:check`
   - synthetic contract flow: snapshot gates are `n/a`

Do not hand-maintain a second matrix in docs. Update the script first, then sync `README.md`, `ARCHITECTURE.md`, `DOCS_POLICY.md`, and `docs/MIGRATION_BRIDGE_DETECTIV0.md` when the supported flow set changes.
