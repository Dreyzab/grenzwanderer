---
id: runtime_orchestrator_v2
tags:
  - type/spec
  - domain/runtime
  - status/active
aliases:
  - VN Runtime Orchestrator v2
---

# Runtime Orchestrator v2

## Goal

Prevent cross-scene async leaks and keep runtime updates cheap in hot paths.

Required guarantees:

- stale async effects do not mutate active scene UI
- one runtime tick applies patch-based state updates with structural sharing

## Lifecycle Epochs

- `runtimeEpoch`: runtime restart boundary
- `scenarioEpoch`: scenario lifecycle boundary
- `sceneEpoch`: increments on scene transition

Any async result must pass epoch guard checks before delivery.

## Effect Context

Every async effect carries:

- `commandId`
- `scopeId`
- `runtimeEpoch`
- `scenarioId`
- `scenarioEpoch`
- `sceneId`
- `sceneEpoch`

Stale policy:

- mismatched scene or scenario context -> drop response
- dropped AI responses are tracked as `ai_stale_drop`

## Atomic Transition Contract

Scene-changing commands execute as:

1. apply `StateDeltaPatch[]`
2. commit transition
3. update epoch pointers
4. emit non-blocking effects

Input guard:

- when runtime status is `transitioning`, secondary scene-changing input is ignored

## State Delta Patch Contract

Runtime hot-path uses patch union, not full snapshot merge.

Patch ops:

- `set_flag`
- `add_flags`
- `add_evidence`
- `set_point_state`
- `set_quest_stage`
- `append_dialogue_entry`
- `set_passive_check_result`
- `update_voice_state`

Rules:

- one runtime tick -> one batched patch commit
- untouched state branches keep reference identity
- full-object merge is forbidden in runtime hot path

## AI Request Contract

`POST /api/parliament/thought` supports:

- `clientEventId`
- `sceneEpoch`
- `commandId`
- `scopeId`

Server echoes:

- `clientEventId`
- `sceneEpoch`

Client accepts response only when:

- event id matches
- effect context is current
- scene pointer is still current

## Feature Flag and Rollout

- env flag: `VITE_RUNTIME_ORCHESTRATOR_V2=true`
- local override: `localStorage.runtime_orchestrator_v2 = "true"`

Rollout order:

1. fullscreen VN
2. overlay VN
3. mind-palace intensive flows

## Telemetry and Budgets

Primary signals:

- `runtime_transition_duration_ms`
- `state_delta_patch_count`
- `ai_stale_drop`

Acceptance targets:

- p95 patch apply <= 4 ms (dev target)
- no unrelated slice rerender cascade on single runtime tick

## Code Anchors

- `apps/web/src/features/detective/runtime/orchestrator.ts`
- `apps/web/src/features/detective/runtime/webRuntimeOrchestrator.ts`
- `apps/web/src/features/detective/dossier/store.ts`
- `apps/web/src/features/detective/lib/useParliamentThought.ts`
- `apps/server/src/modules/parliament-ai.ts`
- `packages/shared/lib/runtime.types.ts`

## Related Notes

- [[99_System/API_Engine_Contract|API Engine Contract]]
- [[99_System/Source_of_Truth|Source of Truth]]
- [[99_System/Narrative_Gameplay_Protocol|Narrative Gameplay Protocol]]
