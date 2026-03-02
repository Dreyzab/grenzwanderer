---
id: source_of_truth
tags:
  - type/policy
  - status/active
---

# Source of Truth

## Purpose

Define which layer is canonical for each class of change and prevent drift between Obsidian and runtime code.

## Canonical Ownership

### Obsidian is canonical for

- narrative intent and dramatic purpose
- location/character lore
- chain-level design rationale
- gameplay node intent and recovery routes

### Code is canonical for

- runtime behavior and transition rules
- API schemas and validation
- deterministic mechanics, formulas, and patch application semantics
- feature flags, metrics, and operational safeguards

## Sync Contract

When runtime behavior changes, update the related Obsidian intent notes in the same delivery cycle.

Minimum update set for runtime changes:

- [[99_System/API_Engine_Contract|API Engine Contract]]
- [[99_System/Runtime_Orchestrator_v2|Runtime Orchestrator v2]]
- [[99_System/Narrative_Gameplay_Protocol|Narrative Gameplay Protocol]]

Additional required updates by scope:

- Parliament roster changes:
  - [[20_Game_Design/Voices/MOC_Parliament|MOC Parliament]]
  - `packages/shared/data/parliament.ts`
- node chain behavior changes:
  - relevant `node_*` notes
  - related gameplay story boards and links

## Runtime Safety Defaults

- deterministic outcome always resolves without AI dependency
- AI output is additive and non-blocking
- stale async output does not enter active scene UI
- full snapshot merges are allowed for hydrate/sync only, not runtime hot path

## Anti-Drift Checklist

- contracts compile in code (`packages/contracts/*`, shared runtime types)
- critical endpoints documented with request/response fields
- feature flag and rollout notes updated
- obsolete contracts removed or marked legacy in the same cycle
