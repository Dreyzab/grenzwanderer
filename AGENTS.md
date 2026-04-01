# AGENTS

This file is the short entry point for coding agents working in this repo.
Detailed SpacetimeDB guidance already lives in the rule files under `.cursor/rules/`.
Do not turn this file back into a full SDK manual.

## Read Order

1. Always apply `.cursor/rules/spacetimedb.mdc`.
2. If you touch TypeScript, React, client bindings, reducers, schema, subscriptions, or procedures, also apply `.cursor/rules/spacetimedb-typescript.mdc`.
3. If a rule example conflicts with the current repo or generated bindings, trust the current repo and regenerate bindings rather than inventing APIs.

## Repo Reality

- This repo currently ships two active SpacetimeDB rule files:
  - `.cursor/rules/spacetimedb.mdc`
  - `.cursor/rules/spacetimedb-typescript.mdc`
- Older references to `spacetimedb-rust.mdc`, `spacetimedb-csharp.mdc`, and `spacetimedb-migration-2.0.mdc` are stale in this repo and should not be treated as available files.
- The active stack here is TypeScript + React + SpacetimeDB.

## Non-Negotiables

- Reducers are transactional and deterministic. Do not add filesystem access, network calls, timers, or randomness to reducer logic.
- Reducers do not return data to callers. Read state through tables, subscriptions, and generated bindings.
- Treat `ctx.sender` as the only trusted identity source.
- Make the smallest necessary change. Do not touch unrelated files or invent new APIs.
- Do not edit generated bindings by hand. Regenerate them after schema or reducer-signature changes.
- Auto-increment IDs are not a safe ordering mechanism.
- Index names are global within a module and must remain unique.
- If you rename or remove an index, update all code that references that exact index name.

## TypeScript / React Fast Rules

- `table()` takes `table(OPTIONS, COLUMNS)`. Indexes belong in `OPTIONS`, not in the column object.
- Use `BigInt` syntax for `u64` and `i64` values: `0n`, `1n`, `42n`.
- Reducer and procedure names come from exports, not string arguments.
- Client reducer calls use object arguments, not positional arguments.
- Import generated connection types from `./module_bindings`, not from imaginary SDK packages.
- `useTable()` returns `[rows, isLoading]`.
- Views should prefer index-backed lookups; avoid `.iter()` in views unless the cost is clearly acceptable.
- Procedures do not get `ctx.db`; use `ctx.withTx(...)`.
- Compare identities via their canonical string form, not by assuming primitive equality behavior.

## Delivery Checklist

1. Update schema and reducer/procedure code.
2. Regenerate bindings if the schema or reducer contract changed.
3. Wire the reducer call from the client if the feature is user-triggered.
4. Confirm the UI reads from subscriptions or `useTable(...)`.
5. Check logs if data does not appear where expected.

## Common Failure Modes

- Backend tables and reducers exist, but the client never calls the reducer.
- Schema changed, but bindings were not regenerated.
- A query still references an old index name.
- A `u64` field was treated as `number` instead of `bigint`.
- Code uses hallucinated SpacetimeDB APIs instead of generated bindings and real SDK calls.

## Useful Commands

```bash
spacetime start
spacetime publish <db-name> --module-path <module-path>
spacetime publish <db-name> --clear-database -y --module-path <module-path>
spacetime generate --lang typescript --out-dir <out> --module-path <module-path>
spacetime logs <db-name>
```

## Maintenance Rule

Keep detailed examples and edge cases in `.cursor/rules/*`.
Keep `AGENTS.md` short, stable, and navigational.
