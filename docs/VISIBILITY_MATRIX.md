# SpacetimeDB Visibility Matrix

Authoritative source of truth for the public-table decision matrix lives in `scripts/visibility-matrix.ts`.

Inspect the current matrix with:

```bash
bun run governance:visibility:matrix
```

Validate matrix coverage against `spacetimedb/src/schema.ts` with:

```bash
bun run governance:visibility:check
```

This matrix answers four repo-backed questions for every current `public: true` table:

1. Which class it belongs to: `public-by-design`, `player-scoped`, or `operational-private`.
2. Which current consumer surfaces still depend on it: player UI, smoke, operator/debug, internal runtime.
3. Which replacement read path is required before any visibility flip.
4. Which migration wave it belongs to.

Do not hand-maintain a second visibility inventory in docs. Update `scripts/visibility-matrix.ts` first, then sync `README.md`, `ARCHITECTURE.md`, and this note.

Current repo-backed summary:

- `5` tables are `public-by-design` and stay in `retain-public` for now.
- `28` tables are `player-scoped` and need `my_*` or similarly scoped replacement reads before closure.
- `5` tables are `operational-private` and form the first migration tranche.

Current first migration tranche:

- `idempotency_log`
- `telemetry_event`
- `telemetry_aggregate`
- `ai_request`
- `worker_identity`

High-blast-radius later waves stay later on purpose:

- `wave2-sessional` covers battle, command, and Mind Palace player-state tables with narrower dedicated UI surfaces.
- `wave3-core-progression` covers the current map/VN/character/home hot path and must not flip visibility before replacement reads exist for supported Freiburg flows.
