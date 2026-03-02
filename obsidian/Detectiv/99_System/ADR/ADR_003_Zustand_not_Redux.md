---
id: adr_003
date: 2026-02-07
status: accepted
---

# ADR_003_Zustand_not_Redux

## Context

Client state includes multiple bounded slices (inventory, quests, dossier, battle) with rapid iteration needs.

## Decision

Use Zustand for local domain stores and React Query style patterns for server synchronization.

## Consequences

Pros: low ceremony and slice autonomy. Cons: requires explicit conventions to avoid ad-hoc state sprawl.

## Alternatives Considered

Redux Toolkit was rejected for higher ceremony relative to current team velocity needs.
