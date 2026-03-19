---
id: node_intro_journalist_origin
aliases:
  - Node: Intro Journalist Origin
tags:
  - type/node
  - status/legacy
  - layer/vn
  - phase/origin
---

# Node: Intro Journalist Origin

## Trigger Source

- Route: `/vn/intro_journalist`
- Source: legacy direct navigation/debug flow only.
- Scenario logic anchor: `apps/web/src/entities/visual-novel/scenarios/detective/origins/intro_journalist.logic.ts`
- Canonical supported onboarding is `journalist_agency_wakeup -> sandbox_agency_briefing`.

## Preconditions

- Required flags: legacy/debug access or optional origin branch trigger.
- Required evidence/items: none.
- Required quest stage: pre-case optional branch.
- Fallback if missing requirements: continue canonical onboarding chain.

## Designer View

- Player intent: play personalized origin flavor before core case loop.
- Narrative function: preserve the older Anna-first flavor branch as optional side content.
- Emotional tone: conspiratorial, intimate, uneasy.

## Mechanics View

- Mechanics used:
  - branch choices in cafe scene;
  - relationship delta (`modify_relationship`);
  - evidence reward (`ev_bank_master_key`);
  - map unlock (`loc_rathaus`);
  - Anna-specific completion flag (`met_anna_intro`), not journalist mainline handoff.

## State Delta

- Potential:
  - `anna_knows_secret=true`
  - `used_shivers_intro=true`
  - `met_anna_intro=true`
  - does not define the canonical journalist onboarding handoff anymore
  - unlocked `loc_rathaus`
  - evidence `ev_bank_master_key`

## Transitions

- END -> legacy/debug continuation only. Supported journalist mainline now starts in the cellar wakeup flow and hands off into `sandbox_agency_briefing`.

## Validation

- Test anchor:
  - play both choice branches and verify flags/evidence/unlock state.
- Done criteria:
  - origin branch changes state in measurable way and exits cleanly to map.

## Branch Diagram

```mermaid
graph TD
  A[Legacy journalist intro] --> B{Play optional branch}
  B -->|Skip| C[Canonical onboarding]
  B -->|Play| D[Dialogue with Anna]
  D --> E[Optional evidence/relationship outcomes]
  E --> C
```
