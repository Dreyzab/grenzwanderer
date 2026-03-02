---
id: engine_vn_runtime
tags:
  - type/system
  - domain/runtime
  - status/active
aliases:
  - VN Runtime Engine
---

# Engine VN Runtime

## Назначение

Детерминированно управлять VN-сценарием: проверять доступность сцен/выборов, вести прогресс сцены и историю диалога, не допуская падения UX при ошибке условия.

## Границы ответственности

- Внутри движка:
  - проверка `preconditions` и `choice.condition`;
  - фильтрация доступных choices;
  - выбор доступной сцены через fallback-цепочку;
  - управление состоянием сценария (`start`, `advance`, `end`) в VN store.
- Вне движка:
  - оркестрация runtime patch/transition (это слой [[99_System/Runtime_Orchestrator_v2|Runtime Orchestrator v2]]);
  - world/map/economy/state на уровне `World Engine`;
  - генерация AI-мыслей.

## Входы

- `VNScenario`, `VNScene`, `VNChoice`.
- `flags: Record<string, boolean>`.
- `VNConditionContext` (квестовые стадии, evidence-контекст).
- `voiceLevels` для voice-gated условий.
- Пользовательский выбор и навигационные события VN UI.

## Выходы

- Отфильтрованный список доступных choices.
- Разрешенный `sceneId` (или `null`, если ни одна сцена не доступна).
- Обновленное состояние VN store:
  - `activeScenarioId`, `currentSceneId`, `history`, `dialogueHistory`, `choiceHistory`.

## Основной цикл

1. `startScenario` и инициализация состояния сценария.
2. `resolveAccessibleSceneId(...)`:
   - candidate scene;
   - fallback на `initialSceneId`;
   - fallback на первую доступную сцену.
3. `filterAvailableChoices(...)` для текущей сцены.
4. Пользователь выбирает choice, фиксируется `recordChoice(...)`.
5. `advanceScene(...)` или `endScenario(...)`.
6. Side effects/action pipeline передается в runtime orchestration слой.

## Инварианты и safety

- Ошибка в predicate-условии не ломает сценарий: condition ловится в `try/catch`, результат = `false`.
- Быстрый повторный старт только что завершенного сценария ограничен guard-окном (`RECENT_SCENARIO_RESTART_GUARD_MS`).
- Движок не выполняет full-store merge в runtime hot path; интеграция идет через patch/orchestrator слой.

## Code anchors

- `apps/web/src/entities/visual-novel/lib/runtime.ts`
- `apps/web/src/entities/visual-novel/model/store.ts`
- `apps/web/src/pages/VisualNovelPage/VisualNovelPage.tsx`
- `apps/web/src/widgets/visual-novel/VisualNovelOverlay.tsx`

## Тесты/проверка

- `apps/web/src/entities/visual-novel/model/__tests__/engine.test.ts`
- `apps/web/src/features/detective/runtime/orchestrator.test.ts`

## Связанные заметки

- [[99_System/Runtime_Orchestrator_v2|Runtime Orchestrator v2]]
- [[99_System/Engine_Quest_Runtime|Engine Quest Runtime]]
- [[99_System/Engine_Story_Spine|Engine Story Spine]]
- [[99_System/MOC_Engines|MOC Engines]]
