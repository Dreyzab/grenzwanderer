---
id: adr_005
date: 2026-02-07
status: accepted
---

# ADR_005_Fog_of_War

## Context

Exploration flow requires deterministic point visibility and progression replay.

## Decision

Use point lifecycle states: `locked -> discovered -> visited -> completed`.

## Consequences

Pros: clear UX progression and testability. Cons: requires explicit transition guards in runtime modules.

## Alternatives Considered

Binary unlocked/locked model was rejected as too coarse for investigation pacing.
