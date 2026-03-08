# Content Release Runbook

## Scope

Operational procedure for publishing and rolling back VN content snapshots using CLI scripts and existing SpacetimeDB reducers.

## Preconditions

- SpacetimeDB server reachable.
- Module published to target DB (`spacetime:publish:local` or `spacetime:publish` as needed).
- Fresh snapshot generated:
  - `bun run content:extract`
- Expected runtime schema:
  - writer emits `schemaVersion: 5`
  - readers accept legacy `v4` and `v5`.

## Release Procedure

1. Validate manifest integrity:

```bash
bun run content:manifest:check
```

2. Validate quality gates:

```bash
bun run quality:loop-poc
bun run content:obsidian:coverage:check
bun run content:map:metrics:check
bun run test
```

Note: `checklist.py` is not part of this repository; use script-based gates above.

3. Validate drift against committed snapshot artifacts:

```bash
bun run content:drift:check
```

4. Publish content:

```bash
bun run content:release -- --version X.Y.Z --server local --db grezwandererdata
```

Optional overrides:

- `--server maincloud`
- `--host <uri>`
- `--db <name>`

Release payload contract:

- CLI publishes the full snapshot payload (`schemaVersion`, `scenarios`, `nodes`, `vnRuntime`, `mindPalace`, `map`, `questCatalog` when present).
- Snapshot metadata fields (`checksum`, `generatedAt`) are excluded from reducer payload before publish.
- `VnChoice` gating fields in v5:
  - `visibleIfAll`, `visibleIfAny` control visibility.
  - `requireAll`, `requireAny` control enablement.
  - legacy `conditions` remains read-only alias for `requireAll`.
- Passive checks lifecycle:
  - node entry resolves passive checks first,
  - interaction is locked until checks resolve,
  - reducer rejects early transitions with `Passive checks pending`.

5. Verify post-conditions:

- `content_version` has one active version.
- active version format is `content-vX.Y.Z+checksum8`.
- `content/vn/releases.manifest.json` has new release entry.

## Rollback Procedure

1. Pick target checksum from manifest.
2. Run rollback:

```bash
bun run content:rollback -- --checksum <sha256> --server local --db grezwandererdata
```

3. Verify:

- target checksum becomes active.
- manifest contains rollback event.

## Troubleshooting

1. `checksum does not match payload content`

- Re-run `bun run content:extract`.
- Do not hand-edit `pilot.snapshot.json`.

2. `targetChecksum is unknown`

- Check manifest and DB history mismatch.
- Ensure you target the same DB/environment.

3. Connection failure

- Validate `--host`, `--db`, and SpacetimeDB server availability.

4. Schema mismatch errors

- Rebuild and republish backend module.
- Ensure snapshot schemaVersion matches reducer expectations.

## Production Guardrail

- Do not publish from debug UI in production.
- Use CLI only after green CI.

RU note: если CI красный, content release в production запрещен независимо от срочности.
