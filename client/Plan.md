# Квестовая подсистема — обзор и связи

```mermaid
flowchart TD
  subgraph Client
    subgraph UI
      MapWidget[widgets/MapWidget/MapWidget.tsx]
      DialogModal[shared/ui/DialogModal.tsx]
      AvailableQuestsModal[shared/ui/AvailableQuestsModal.tsx]
      SettingsPage[pages/SettingsPage.tsx]
      QuestsPage[pages/QuestsPage.tsx]
    end

    subgraph MapWidget:model
      useMapInstance[useMapInstance]
      useVisiblePoints[useVisiblePoints]
      useMarkers[useMarkers.tsx]
      questSources[server npcId / eventKey]
      useAvailableQuests[useAvailableQuests]
      useDialogAutoplay[useDialogAutoplay]
      useRegistrationPrompt[useRegistrationPrompt]
    end

    subgraph Feature:quest-progress
      visibility[server-side in convex/mapPoints.ts]
      decideDialogKey[features/quest-progress/model/decideDialogKey.ts]
      actionCoordinator[features/quest-progress/model/actionCoordinator.ts]
      conditions[features/quest-progress/model/conditions.ts]
      outcomes[features/quest-progress/model/outcomes.ts]
    end

    subgraph Entities:quest
      questStore[entities/quest/model/questStore.ts]
      progressionStore[entities/quest/model/progressionStore.ts]
      useQuest[entities/quest/model/useQuest.ts]
      catalog[entities/quest/model/catalog.ts]
      ids[entities/quest/model/ids.ts]
      types[entities/quest/model/types.ts]
      fsmDelivery[entities/quest/model/fsm/deliveryMachine.ts]
      fsmCombat[entities/quest/model/fsm/combatMachine.ts]
    end

    subgraph Shared
      dialogs[shared/storage/dialogs.ts]
      questDialogs[shared/storage/*QuestDialogs.ts]
      sanitizeQuests[shared/lib/sanitizeQuests.ts]
      convexClient[shared/lib/convexClient.ts]
      questsApi[shared/api/quests/convex.ts]
      mapPointsApi[shared/api/mapPoints/convex.ts]
      mapTypes[shared/types/core/mapPoint.ts]
    end
  end

  subgraph Server(Convex)
    schema[convex/schema.ts]
    mapPoints[convex/mapPoints.ts]
    quests[convex/quests.ts]
    questsHelpers[convex/quests.helpers.ts]
    auth[convex/auth.ts]
  end

  %% Flows
  MapWidget --> useMapInstance
  MapWidget --> useVisiblePoints
  MapWidget --> useMarkers
  MapWidget --> useAvailableQuests
  MapWidget --> useDialogAutoplay
  MapWidget --> useRegistrationPrompt

  useVisiblePoints --> mapPointsApi
  useMarkers --> AvailableQuestsModal
  useMarkers --> DialogModal
  useAvailableQuests --> questsApi

  actionCoordinator --> questsApi
  actionCoordinator --> questStore
  actionCoordinator --> outcomes

  questsApi --> convexClient
  mapPointsApi --> convexClient
  convexClient --> quests
  convexClient --> mapPoints

  quests --> questsHelpers
  quests --> schema
  mapPoints --> schema

  DialogModal --> dialogs
  dialogs --> questDialogs

  MapWidget --> questStore
  MapWidget --> progressionStore
  MapWidget --> catalog
  MapWidget --> ids

  auth --> schema
```

Примечания:
- Списки квестов на хабах: `quests.getAvailableQuests({ sourceType, sourceKey })` (источники npc/board приходят с сервера через `npcId`/`eventKey`).
- FSM для квестов: `deliveryMachine.ts`, `combatMachine.ts` (остальные по мере добавления).

Сервер (Convex)
client/convex/schema.ts — таблицы: quest_progress, player_state(hasPda), world_state, quest_registry, map_points, mappoint_bindings(npcId/startKey/dialogKey), quest_dependencies, qr_codes.
client/convex/quests.ts — публичные query/mutation: прогресс, выдача доступных квестов (учёт зависимостей), применение исходов, сид реестра.
client/convex/quests.helpers.ts — фильтры по требованиям, приоритезация, загрузка состояния игрока/мира, унифицированная выдача, зависимости.
client/convex/mapPoints.ts — серверная фильтрация видимых точек по `mappoint_bindings`/требованиям/зависимостям; обогащение `dialogKey/eventKey/npcId`.
client/convex/auth.ts — me, вспомогательная миграция device→user.
client/convex/auth.config.ts — конфиг провайдера JWT (Clerk) для Convex.

Доменные сущности (клиент)
client/src/entities/quest/model/ids.ts — реестр QuestId и типобезопасность.
client/src/entities/quest/model/types.ts — типы шагов/квестов.
client/src/entities/quest/model/catalog.ts — метаданные стартов квестов (фаза/точка/стартовый шаг).
client/src/entities/quest/model/questStore.ts — локальный Zustand-стор квестов.
client/src/entities/quest/model/progressionStore.ts — фаза/прогресс игрока.
client/src/entities/quest/model/useQuest.ts — хуки доступа к сторам.
client/src/entities/quest/model/fsm/deliveryMachine.ts — FSM «Доставка…».
client/src/entities/quest/model/fsm/combatMachine.ts — FSM «Боёвое Крещение».

Фича «Прогресс квестов»
client/src/features/quest-progress/model/actionCoordinator.ts — диспетчер действий из диалогов → FSM/мутации.
client/src/features/quest-progress/model/actionMap.ts — карта action→обработчик.
client/src/features/quest-progress/model/conditions.ts — условия выбора в диалогах.
client/src/features/quest-progress/model/decideDialogKey.ts — выбор нужного диалога по точке/состоянию квестов.
client/src/features/quest-progress/model/outcomes.ts — применение игровых исходов.

API-слой (клиент)
client/src/shared/api/quests/convex.ts — обёртки над Convex: прогресс, выдача квестов (NPC/доски/универсальная), applyOutcome, сид реестра, фаза.
client/src/shared/api/quests/index.ts — экспорт API.
client/src/shared/api/mapPoints/convex.ts — запросы/сид карты (связь точек с квестами через questId).

Контент диалогов (квесты)
client/src/shared/storage/dialogs.ts — реестр всех диалогов.
client/src/shared/storage/.ts — файлы диалогов квестов: deliveryQuestDialogs.ts, loyaltyQuestDialogs.ts, waterQuestDialogs.ts, freedomQuestDialogs.ts, combatBaptismQuestDialogs.ts, fieldMedicineQuestDialogs.ts, quietCoveQuestDialogs.ts, bellQuestDialogs.ts, citizenshipQuestDialogs.ts, eyesInDarkQuestDialogs.ts, voidShardsQuestDialogs.ts.
client/src/shared/dialogs/types.ts — типы диалоговой системы.

Виджет карты (интеграция квестов в карту)
client/src/widgets/MapWidget/MapWidget.tsx — композиция: загрузка точек, диалоги, модалки квестов.
client/src/widgets/MapWidget/model/useVisiblePoints.ts — загрузка точек (server/local fallback), автофокус.
client/src/widgets/MapWidget/model/useMarkers.tsx — рендер маркеров/тултипов, обработка кликов (NPC/доски по server `npcId`/`board`, диалоги).
client/src/widgets/MapWidget/model/useAvailableQuests.ts — универсальный хук открытия модалки со списком квестов.
client/src/widgets/MapWidget/model/useDialogAutoplay.ts — автозапуск диалога по query / QR nextAction.
client/src/widgets/MapWidget/model/useRegistrationPrompt.ts — приглашение к регистрации по прогрессу.
client/src/widgets/MapWidget/model/useMapInstance.ts — инициализация карты.

UI-модалки/экраны
client/src/shared/ui/DialogModal.tsx — показ диалогов квестов.
client/src/shared/ui/AvailableQuestsModal.tsx — список доступных квестов (NPC/доски).
client/src/shared/ui/RegistrationPrompt.tsx — приглашение к регистрации (после доставки, гость).
client/src/pages/QuestsPage.tsx — экран квестов (список/создание).
client/src/pages/SettingsPage.tsx — сиды/синхронизация/фаза/отладка.

Инициализация/гидрация
client/src/app/ConvexProvider.tsx — QuestHydrator: подтягивает прогресс/мир/состояние игрока из Convex, миграции, установка фазы.

Прочее полезное
client/src/shared/lib/sanitizeQuests.ts — валидация и нормализация выдачи списков квестов (NPC/доски).
client/src/entities/map-point/api/seed.ts — демо-точки (привязка questId/dialogKey к маркерам).
client/src/shared/types/core/mapPoint.ts — базовые типы карты (вкл. questId в точках).

Основные сущности (Entity/типовые структуры)
QuestId, QuestStep, ActiveQuest — идентификаторы и шаги квестов.
QuestMeta, QuestRequirementsMeta — метаданные квестов и требования (phase/fame/flags/reps/relations).
PlayerStateRow, WorldStateRow — состояние игрока/мира на сервере.
MapPoint/VisibleMapPoint — точка карты и её расширения (questId, dialogKey, type, npcId, eventKey).
DialogDefinition — описание диалога (узлы, переходы, action/condition).

Сторы/хранилища (Zustand)
questStore — активные/завершённые квесты, методы: startQuest, advanceQuest, completeQuest, hydrate.
progressionStore — текущая фаза/синхронизация фазы.
player store (hydrateFromServer, credits/skills).

Серверные функции (Convex)
Прогресс/состояние: getProgress, getPlayerState, setPlayerPhase, migrateDeviceProgressToUser.
completeQuest, startQuest, advanceQuest.
getWorldState, setWorldPhase.

Реестр/выдача квестов:
getAvailableQuests({ sourceType, sourceKey }) — универсальная выдача (NPC/доски).
getAvailableQuestsForNpc(npcId), getAvailableBoardQuests(boardKey).
applyOutcome (fame/rep/relations/flags/phase/status).
upsertQuestRegistry, seedQuestRegistryDev.

Карта:
mapPoints.listVisible({ deviceId?, userId?, bbox? }) — серверная видимость; возвращает `dialogKey/eventKey/npcId`.
listAll(), upsertManyDev(points, devToken).

Клиентские API-функции
questsApi: getProgress, getPlayerState, setPlayerPhase, migrateDeviceToUser.
startQuest, advanceQuest, completeQuest, applyOutcome.
getAvailableQuests(sourceType, sourceKey), getAvailableQuestsForNpc(npcId), getAvailableBoardQuests(boardKey).
seedQuestRegistryDev.
mapPointsApi: listVisible, listAll, upsertManyDev(points, token).

Фиче‑логика (модели/хелперы)
- decideDialogKey(point, qs) — фолбэк выбора диалога по точке и состоянию квестов.
- actionCoordinator.handle(actionKey, eventOutcomeKey) — диспетчер действий из диалогов.
- conditions.* — проверка условий диалогов (по игроку/прогрессу).
- outcomes.* — вычисление и применение исходов.

Серверные хелперы (quests.helpers.ts)
filterQuestsByRequirements(quests, player, world, completedSet).
questTypeRank(type) — сортировка по типу: story > personal > faction > procedural.
loadPlayerWorldProgress(db, deviceId?, userId?).
listFromSource(db, sourceType, sourceKey) — выборка из quest_registry.
computeAvailableQuests(db, sourceType, sourceKey, deviceId?, userId?).
pickWinnerProgress(a, b) — слияние дублей прогресса (completed/updatedAt).

Виджет карты — хуки
useMapInstance(ref) — инициализация Mapbox GL.
useVisiblePoints() — загрузка (server/local), автофокус.
useMarkers(mapRef, points, interactions) — создание маркеров/попапов, обработчики кликов (NPC/доски/диалоги/старт по eventKey), безопасный unmount.
useAvailableQuests(setModal) — openBoard/openNpc/refresh (центральный источник списков).
useDialogAutoplay() — автопоказ диалога по query/QR.
useRegistrationPrompt() — показ приглашения к регистрации по прогрессу.

## Дорожная карта реализации (пошагово)

1) Сервер: индексы, события и видимость
- Добавить действие `actions.resolveEventKey` (обработка `quest:*`/`npc:*`/`board:*`, валидация, идемпотентность).
- Расширить `mapPoints.listVisible({ bbox? })` и клиентскую передачу `bbox`.

2) Социальная система
- Таблицы/поля репутации фракций и отношений с NPC; пороги в `quest_registry.requirements`.
- UI подсказки порогов + бейджи фракций.

3) QR‑скан
- Страница `QRScanPage` (zxing) → `qr.resolvePoint` → nextAction; E2E сценарий.

4) UX
- Фильтры карты (тип/фракция), журнал квестов, тосты.

5) Админ/контент
- Формы и импорт/экспорт для `quest_registry`/`mappoint_bindings`/`quest_dependencies`.
- YAML/JSON формат + валидатор + импорт→сид.

6) Тесты/CI
- Юнит Convex, интеграция, E2E; CI pipeline.

7) Наблюдаемость/безопасность
- Rate limiting для QR/сидов, роли; метрики `listVisible`, Sentry.