# OpenViking Case01 Audit

Use this checklist when validating that OpenViking sees the same Case01 canon as
the runtime, StoryDetective authoring, and Detectiv reference docs.

## Prerequisites

- OpenViking API is reachable at `http://127.0.0.1:1933`
- The repo has already run `bun run content:extract`
- The relevant scopes have been reindexed from the repo root

## Reindex Commands

```bash
bun run openviking:index:runtime
bun run openviking:index:case01
bun run openviking:index:design
bun run openviking:index:roadmap
```

## Quick Smoke

```bash
bun run openviking:smoke:case01
```

This smoke should confirm:

- the server is healthy
- Case01 canon queries resolve
- alias grep finds `Lotte Weber`, `Lotte Fischer`, `Fritz Muller`, and
  `Fritz Mueller`
- canonical state fields `bureau_trace_found`, `convergence_route`, and
  `case01_final_outcome` are indexed

## Narrative Audit

```bash
bun run openviking:audit:case01
```

Optional focused mode:

```bash
bun run openviking:audit:case01 -- -FindOnly -MaxFiles 4
```

## Expected Findings

- supported runtime path is `case01_hbf_arrival -> Fritz priority choice ->
  bank/Mayor -> leads -> convergence -> warehouse finale`
- authored branch scenes live in
  `obsidian/StoryDetective/40_GameViewer/Case01/_runtime`
- Detectiv alias material is visible under design/reference scope, not confused
  with runtime canon
- roadmap/runtime/design scopes can all describe the same Case01 line without
  `sandbox_case01_pilot` reappearing as the supported mainline
