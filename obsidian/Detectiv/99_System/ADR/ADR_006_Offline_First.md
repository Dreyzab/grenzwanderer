---
id: adr_006
date: 2026-02-07
status: accepted
---

# ADR_006_Offline_First

## Context

Player sessions must remain resilient during intermittent connectivity.

## Decision

Persist critical client slices in localStorage and sync with server snapshots opportunistically.

## Consequences

Pros: resilient play and faster UX. Cons: conflict resolution and reconciliation logic required.

## Alternatives Considered

Server-only persistence was rejected due to brittle UX under network instability.
