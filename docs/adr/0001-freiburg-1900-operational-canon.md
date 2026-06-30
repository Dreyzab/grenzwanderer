# 0001 — Freiburg 1900 operational canon; 1905 legacy until ADR

Status: Accepted  
Date: 2026-06-30  
Project: `grenzwanderer/Grenzwanderer`

## Context

Project material has drifted between `1900` and `1905` labels. The implemented detective/Case01 policy in `docs/CURRENT_CANON.md` and `data/currentCanon.ts` already treats `1900` as the operational detective era, while some player-flow labels, atmosphere notes, templates, and visual briefs still say `1905`.

This creates authoring risk: future contributors and agents may treat old `1905` wording as runtime canon and write scenes, UI, or historical assumptions against the wrong year.

## Decision

Supported Freiburg / Case01 uses **1900 as operational canon**.

`1905` is a **legacy / prototype / display-drift label** until a future ADR explicitly promotes it or defines a split policy.

## Consequences

- Runtime, docs, and acceptance flow labels should say `Freiburg 1900` unless they are deliberately describing legacy material.
- Existing `1905` references in visual briefs, templates, or older design notes are not automatically canon-breaking, but they must be treated as legacy drift or reference material.
- Promoting `1905` later requires a new ADR explaining the historical, UI, content, and runtime migration cost.
- Shared Earth↔Edem canon is not automatically changed by this project-local decision.

## Rejected alternatives

### Promote 1905 now

Rejected because it would contradict the current machine-ledger contract and would require a broader migration of runtime labels, docs, visual prompts, and historical assumptions.

### Split gameplay 1900 and UI/marketing 1905 now

Rejected for now because it would preserve confusion unless a full display-date policy is designed. A split remains possible in a future ADR.
