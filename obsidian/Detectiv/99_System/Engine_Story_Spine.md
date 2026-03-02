---
id: engine_story_spine
tags:
  - type/system
  - domain/narrative
  - status/developing
aliases:
  - Story Spine Engine
---

# Engine Story Spine

## Назначение

Управлять адаптивным сюжетным gate-слоем между map/VN: проверять условия ключевых узлов, выдавать recovery-card reroute, вести детерминированный deck state и предотвращать hard-stop сценария.

## Границы ответственности

- Внутри движка:
  - оценка `StoryCondition` и gate-прохода узла;
  - deterministic weighted draw для city event cards;
  - управление deck/hand/cooldown/doom/history/pity;
  - reroute в recovery-сценарии и forced bypass по правилам.
- Вне движка:
  - базовый VN runtime и scene navigation;
  - world API и persistence;
  - генерация AI-контента.

## Входы

- `StoryEvaluationContext`: flags, questStages, voiceLevels, relations, historyTags.
- `SpineNodeSpec` и `CityEventCard` data.
- События сценария: start/end, map binding tick, VN end tick.

## Выходы

- `ScenarioPreparationResult`:
  - `allow=true` (прямой проход),
  - reroute в recovery scenario,
  - `allow=false` с причиной блокировки.
- Обновленный `LivingDeckState`.
- Дополнительные map interactions для host points.

## Основной цикл

1. Инициализация case-spine deck (`initializeCase01` / `ensureCase01ForQuestStage`).
2. Перед стартом сценария: `prepareScenarioStart(...)`.
3. Gate evaluation:
   - hard requirements;
   - acceptable keys;
   - адаптивный draw recovery cards.
4. При необходимости:
   - reroute в recovery scenario;
   - forced bypass после исчерпания recovery attempts.
5. По завершению city event: `resolveCityEvent(...)` обновляет keys/doom/history/cooldown.
6. Beat progression (`tickBeatFromVnEnd`, `tickBeatFromMapBinding`) и переоценка hand/cooldowns.

## Инварианты и safety

- Детеминизм draw-пула: seed + draw index.
- Нет критического hard-fail без recovery route:
  - сначала recovery draw,
  - затем controlled forced bypass по policy.
- Невалидный gate state не приводит к silent skip: фиксируется telemetry (`gate_blocked`, `rerouted`, `forced_bypass`).
- Карточки с TTL и cooldown не должны бесконечно повторяться в hand.

## Code anchors

- `packages/shared/lib/story-spine-engine.ts`
- `packages/shared/lib/story-spine.types.ts`
- `apps/web/src/features/story-spine/store.ts`
- `apps/web/src/features/story-spine/orchestrator.ts`
- `apps/web/src/widgets/map/map-view/MapView.tsx`

## Тесты/проверка

- `apps/web/src/features/story-spine/store.test.ts`
- Проверка интеграции reroute/block в map action pipeline:
  - `apps/web/src/features/detective/lib/map-action-handler.ts`

## Связанные заметки

- [[99_System/Engine_Map_Resolver|Engine Map Resolver]]
- [[99_System/Engine_VN_Runtime|Engine VN Runtime]]
- [[99_System/Narrative_Gameplay_Protocol|Narrative Gameplay Protocol]]
- [[99_System/MOC_Engines|MOC Engines]]
