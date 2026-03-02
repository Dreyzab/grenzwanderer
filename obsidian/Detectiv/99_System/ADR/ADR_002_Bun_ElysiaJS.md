---
id: adr_002
date: 2026-02-07
status: accepted
---

# ADR_002_Bun_ElysiaJS

## Context

Need fast iteration for TypeScript full-stack runtime with lightweight HTTP layer.

## Decision

Adopt Bun runtime with ElysiaJS for server modules and tooling.

## Consequences

Pros: startup/build speed and cohesive TS workflow. Cons: ecosystem edge cases vs Node baseline.

## Alternatives Considered

Node + Express was rejected for slower feedback loop and additional boilerplate.
