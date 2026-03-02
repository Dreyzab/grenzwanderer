---
id: adr_001
date: 2026-02-07
status: accepted
---

# ADR_001_Monorepo_FSD

## Context

Project has tightly coupled gameplay, content, and shared contracts across web, server, and shared packages.

## Decision

Use a modular monorepo with FSD boundaries for frontend and domain packages, instead of microservices at this stage.

## Consequences

Pros: shared types and faster cross-layer delivery. Cons: stricter workspace discipline needed.

## Alternatives Considered

Microservices split by domain was rejected due to premature operational overhead.
