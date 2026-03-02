---
id: adr_004
date: 2026-02-07
status: accepted
---

# ADR_004_Location_Identity

## Context

Map points and narrative nodes need stable identity across UI, DB, and Obsidian.

## Decision

Treat `locationId` as canonical identity; `map_point.id` is transport/storage detail.

## Consequences

Pros: consistent linking and less coupling to persistence internals. Cons: migration discipline required when ids evolve.

## Alternatives Considered

Using DB point primary keys as canonical ids was rejected due to weak narrative portability.
