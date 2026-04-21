# Gameplay Loop PoC Checklist

## Scope

Hardening checklist for Mind Palace gameplay loop:

- fact discovery toast,
- ready hypothesis badge on `Scan`,
- hypothesis validation reward toast,
- demo loop reproducibility from Debug tab.

## Standard Commands

`checklist.py` is not present in this repository, so quality gates are command-based.

Run in order:

```bash
bun run quality:loop-poc
bun run content:manifest:check
```

When local SpacetimeDB is running:

```bash
bun run smoke:mindpalace
```

## Manual E2E (7 Steps)

1. Start app and local SpacetimeDB (`bun run dev`, DB at `ws://127.0.0.1:3000`).
2. Open `Debug` tab.
3. Click `Start Demo Case` and confirm info toast appears.
4. Click `Grant Demo Fact` and confirm `New Fact: ...` toast appears once.
5. Confirm `Scan` tab shows ready badge.
6. Open `Scan`, validate loop demo hypothesis.
7. Confirm reward toast appears and `Scan` ready badge disappears.

## Automated Assertions

1. Toast dedupe: duplicate sync event for same fact/hypothesis does not create duplicate toast in dedupe window.
2. Readiness consistency: shared readiness model drives both navbar badge and case summary.
3. Dev cheats: success toast only after awaited reducer success; reducer failures surface as `Dev cheat failed: ...`.
4. Reconnect behavior: existing facts/hypotheses at first hydration do not backfill old toasts.
