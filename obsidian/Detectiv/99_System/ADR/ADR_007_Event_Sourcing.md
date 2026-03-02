---
id: adr_007
date: 2026-02-07
status: accepted
---

# ADR_007_Event_Sourcing

## Context

Need replayable debug trail for world progression, reputation, travel, and evidence updates.

## Decision

Append domain events to `domain_event_log` for audit, replay, and debugging workflows.

## Consequences

Pros: traceability and reproducible bug analysis. Cons: storage growth and event schema governance overhead.

## Alternatives Considered

State snapshots without event log were rejected for insufficient forensic debugging capability.
