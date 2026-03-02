---
id: sys_fog_of_war
tags:
  - type/system
  - status/developing
---

# Sys Fog Of War

Design note for unexplored city zones and their reveal logic.

## Intent

- Keep exploration meaningful without slowing down narrative pacing.
- Reveal city knowledge in steps, tied to investigation progress.

## Core state model

- `unknown`: player has no reliable knowledge.
- `visible`: location name/outline is known, details hidden.
- `explored`: player has visited or remotely verified.
- `resolved`: location arc is completed for current case context.

## Reveal channels

- Travel arrival (`engine/travel/complete`).
- Travel beats (`intel_audio`, rumors, faction contact).
- Evidence-based reveal (`evi_*` unlocks a `loc_*`).
- Social unlocks (NPC or faction grants access/intel).

## Links and IDs

- Canonical anchor is `loc_*` (stable).
- `map_point` entries are presentation nodes attached to `loc_*`.
- Objectives should bind to `locationId` first, then to scene/action details.

## UX constraints

- No dead waiting: movement must deliver context or choice.
- Fog should hide certainty, not hide all agency.
- Deduction-first rule: progression opens routes, it should not block player reasoning.

## Code anchors

- `apps/server/src/modules/engine.ts`
- `apps/web/src/widgets/map/map-view/MapView.tsx`
- `packages/shared/lib/detective_engine_types.ts`
