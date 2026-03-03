# Content Release Runbook

## Scope

Operational procedure for publishing and rolling back VN content snapshots using CLI scripts and existing SpacetimeDB reducers.

## Preconditions

- SpacetimeDB server reachable.
- Module published to target DB (`spacetime:publish:local` or `spacetime:publish` as needed).
- Fresh snapshot generated:
  - `bun run content:extract`

## Release Procedure

1. Validate manifest integrity:

```bash
bun run content:manifest:check
```

2. Publish content:

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

3. Verify post-conditions:

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
