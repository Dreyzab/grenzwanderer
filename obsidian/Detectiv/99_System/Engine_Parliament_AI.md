---
id: engine_parliament_ai
tags:
  - type/system
  - domain/ai
  - status/active
aliases:
  - Parliament AI Engine
---

# Engine Parliament AI

## Назначение

Доставлять additive AI-thought реплики для голосов Парламента без блокировки детерминированного runtime-прогресса.

## Границы ответственности

- Внутри движка:
  - серверная генерация мысли (`/api/parliament/thought`);
  - клиентская очередь событий с приоритетом и coalescing;
  - race-safe доставка с проверкой `clientEventId` и epoch context;
  - stale-drop telemetry.
- Вне движка:
  - обязательное прохождение VN/quest/map логики;
  - применение детерминированных state patches.

## Входы

- Thought request payload:
  - `voiceId`, `outcome`, `sceneId`, `eventType`
  - `clientEventId`, `sceneEpoch`, `commandId`, `scopeId`
  - optional check/deduction context.
- `EffectContext` из runtime orchestrator.
- Текущий scene pointer в клиентском runtime.

## Выходы

- Ответ AI:
  - `text`
  - `generated`
  - echo `clientEventId`, `sceneEpoch`
  - `quota` metadata
- Клиентский callback на отрисовку thought (только если response не stale).

## Основной цикл

1. Runtime событие ставится в очередь `useParliamentThought`.
2. Очередь применяет priority/coalescing/cooldown policy.
3. Запрос отправляется на `POST /api/parliament/thought`.
4. Ответ валидируется по:
   - `clientEventId`,
   - scene match,
   - `isEffectContextCurrent(...)`.
5. Если ответ свежий: thought добавляется в UI; если stale: дроп и метрика.

## Инварианты и safety

- AI слой не блокирует core progression.
- При scene switch активные AI запросы abort-ятся.
- Stale/late ответ не применяется к текущей сцене.
- Некорректный `voiceId` не падает в exception: сервер возвращает `generated=false`.

## Code anchors

- `apps/server/src/modules/parliament-ai.ts`
- `apps/web/src/features/detective/lib/useParliamentThought.ts`
- `apps/web/src/features/detective/lib/parliamentPayload.ts`
- `packages/shared/lib/parliament-ai.types.ts`
- `apps/web/src/features/detective/runtime/orchestrator.ts`

## Тесты/проверка

- `apps/server/test/modules/parliament-ai.test.ts`
- `apps/web/src/features/detective/lib/useParliamentThought.test.ts`
- `apps/web/src/features/detective/lib/parliamentPayload.test.ts`

## Связанные заметки

- [[99_System/API_Engine_Contract|API Engine Contract]]
- [[99_System/Runtime_Orchestrator_v2|Runtime Orchestrator v2]]
- [[20_Game_Design/Voices/MOC_Parliament|MOC Parliament]]
- [[99_System/MOC_Engines|MOC Engines]]
