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

Current Freiburg social flows in the matrix:

- `freiburg_social_access`
- `freiburg_rumor_verification`
- `freiburg_agency_career_progression`
- `freiburg_service_unlock`

Current Case01 canon in the matrix:

- canonical default entry: `case01_hbf_arrival`
- supported mainline: `case01_hbf_arrival -> bank/Mayor priority -> leads -> convergence -> finale`
- authored branch coverage: `Mayor/lead/estate -> Lotte interlude -> convergence_route -> warehouse outcome`
- `sandbox_case01_pilot`, `sandbox_banker_pilot`, `sandbox_dog_pilot`, and `sandbox_ghost_pilot` remain side/dev content and are not the supported Case01 mainline
- canonical Case01 branch contracts are `bureau_trace_found`, `convergence_route`, and `case01_final_outcome`
