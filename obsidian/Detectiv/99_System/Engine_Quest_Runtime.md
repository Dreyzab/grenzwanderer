---
id: engine_quest_runtime
tags:
  - type/system
  - domain/quests
  - status/developing
aliases:
  - Quest Engine
  - Quest Runtime Engine
---

# Engine Quest Runtime

## Назначение

Управлять жизненным циклом квестов в клиентском runtime: регистрация каталога, серверная гидрация прогресса, оценка objective/transition по флагам и запуск привязанных действий.

## Границы ответственности

- Внутри движка:
  - `registerQuest(...)` и инициализация квестового каталога;
  - `hydrateFromServer()` и поддержка серверного состояния;
  - `evaluateQuests(flags)` и обновление стадий;
  - отслеживание переходов стадии и запуск `triggerActions` через адаптер.
- Вне движка:
  - правила map-point резолва (Map Resolver);
  - world time/travel/relations (World Engine);
  - VN scene gate/orchestration.

## Входы

- Флаги и состояние dossier (`useDossierStore`).
- Квестовый каталог (`QUESTS` + runtime generated quests).
- Состояние `userQuests` и `isServerHydrated`.
- Transition actions (legacy `triggerActions` и типизированные action payloads через normalizer).

## Выходы

- Обновленные стадии квестов (`setQuestStage` / `startQuest`).
- Серверная синхронизация квестового состояния.
- Выполненные map/domain actions через `useMapActionHandler`.

## Основной цикл

1. При запуске runtime: регистрация квестов + начальный `refreshCatalog()`.
2. Периодическое обновление каталога (интервал `30_000 ms`).
3. Гидрация квестов с сервера.
4. После гидрации: автозапуск обязательного стартового квеста (например, `case01`, если отсутствует).
5. На изменение флагов: `evaluateQuests(flags)`.
6. При смене стадии: детект transition и выполнение нормализованных actions.

## Инварианты и safety

- Оценка и transition-логика не запускаются до `isServerHydrated = true`.
- Неизвестный формат action логируется как warning и не падает в исключение.
- `triggerActions` обрабатываются как compatibility-слой и помечены как deprecated в dev.
- Стадии валидируются по sequence для соответствующего quest id.

## Code anchors

- `apps/web/src/features/quests/engine.ts`
- `apps/web/src/features/quests/store.ts`
- `apps/web/src/features/detective/lib/map-action-handler.ts`
- `apps/web/src/entities/visual-novel/lib/actionNormalizer.ts`
- `apps/web/src/widgets/GameRuntime.tsx`

## Тесты/проверка

- `apps/web/src/features/quests/__tests__/case01-quest-contract.test.ts`
- `apps/web/src/features/quests/__tests__/sandbox-triggeractions-contract.test.ts`
- `apps/web/src/features/quests/store.catalog.test.ts`

## Связанные заметки

- [[99_System/Engine_VN_Runtime|Engine VN Runtime]]
- [[99_System/Engine_Map_Resolver|Engine Map Resolver]]
- [[99_System/API_Engine_Contract|API Engine Contract]]
- [[99_System/MOC_Engines|MOC Engines]]
