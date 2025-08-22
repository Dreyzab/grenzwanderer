## Обновлённый план (актуально)

### Gameplay: общий поток
- Game_Start: кат‑сцена, bootstrap нового игрока (`status=refugee`, `fame=0`, базовые предметы).
- На карте видны стартовые точки (серверная фильтрация); диалоги стартуют по `dialogKey`, решённому на сервере (`qr.resolvePoint`).
- Старт квеста доставки → подсветка цели ведёт по шагам (`trader_camp` → `workshop_center` → `northern_anomaly` → возврат).
- Регистрация: после входа через Clerk показывается модал создания персонажа, `finalizeRegistration` переносит прогресс и поднимает фазу.

### Бэкенд (Convex)
- Таблицы: `map_points`, `mappoint_bindings`, `quest_registry`, `quest_dependencies`, `qr_codes`, `quest_progress`, `player_state`, `world_state`, `users`, `dialog_outcomes`, `dialog_actions`.
- Квесты: `getProgress`, `start/advance/complete` (для низкоуровневого контроля), `applyOutcome`, `bootstrapNewPlayer`, `finalizeRegistration`, `migrateDeviceProgressToUser`, `getAvailable*`, `upsertQuestRegistry`, `initializeSession`.
- Диалоги:
  - `qr.resolvePoint` — возвращает `dialogKey`, `playerState`, `nextAction`.
  - `dialogs.applyDialogOutcome` — принимает `outcomeKey` и атомарно применяет эффекты (флаги/репутации/фаза/мир) + опциональный прогресс квеста (реестр из БД `dialog_outcomes`).
  - `dialogs.resolveAction` — возвращает дескриптор действия по `actionKey` из БД (`dialog_actions`).
- Хелперы: `helpers/quest`, `helpers/migration`, `helpers/player`, `helpers/mappoints`, `helpers/qr`.
- Константы: `PLAYER_STATUS`, `WORLD_KEYS`, `QUEST_SOURCE`, `QR_RESOLVE_STATUS`, `NEXT_ACTION`.
- Вебхук Clerk (`auth.upsertFromClerk`) — строгая схема, без `v.any()`.

### Фронтенд (FSD)
- Страница `MapPage`: оборачивает карту в `MapContainer` и `MapOverlaysProvider`.
- Виджет `MapWidget`: отвечает только за карту (инициализацию из контекста, маркеры, tracked target).
- Модалки: `MapOverlaysProvider` управляет `DialogModal`, `AvailableQuestsModal`, `RegistrationPrompt`, `CreateCharacterModal`.
- Диалоги: клиент не выбирает `dialogKey` — всегда запрашивает `qr.resolvePoint` и запускает движок с полученным ключом; финал — `applyDialogOutcome`.
- Типы/константы: `MapPointType` (`MAP_POINT_TYPE`) для точек, `NextActionType` для действий после QR.

### Реактивная гидратация
- `useServerProgressHydration` — подписка на `quests.getProgress` → гидратация стора квестов.
- `useWorldPhaseSync` — подписка на `quests.getWorldState` → синхронизация фазы (для аутентифицированных).
- `QuestHydrator` (тонкий): единый вызов `quests.initializeSession` возвращает снимок `player_state`/`quest_progress`/`world_state` и `userId`.

### Серверная фильтрация видимых точек
- `mapPoints.listVisible`: определяет стартовые точки из биндингов с учётом требований `quest_registry`, зависимостей `quest_dependencies`, фазовых окон и начатости/завершённости квеста.
- Для диагностики: `mapPoints.listVisibleDebug` возвращает причины отбора/исключения.

### Регистрация и профиль
- Кнопки Clerk используют `forceRedirectUrl=/map?createCharacter=1`.
- `finalizeRegistration` переносит прогресс device→user, обновляет профиль, устанавливает `player_state.phase=1` и `world_state.phase=1`.

### Checklist
- [ ] Прогнать dev‑сиды: `quest_registry`, `quest_dependencies`, `mappoint_bindings`, `map_points`, `qr_codes`, `dialog_outcomes`, `dialog_actions`.
- [ ] Проверить поток: QR → `resolvePoint` → старт диалога → `applyDialogOutcome`.
- [ ] Проверить миграцию device→user и показ CreateCharacterModal после логина.
- [ ] Проверить подсветку цели и видимость стартовых точек (только сервер).

### Mapbox GL (коротко)
- Источник `mappoints` (GeoJSON, `promoteId: 'id'`).
- Слои: `mappoints` (circle), `tracked-glow` (circle, пульсирующий). Скрыт, если цели нет.
- События: `click` (всегда через `qr.resolvePoint`), hover‑tooltip, безопасный cleanup.

### Логирование и диагностика
- Сервер: `[MAPPOINTS][visible] args/metas/bindings/points` в `mapPoints.listVisible`.
- Клиент: `MAP visible points loaded` (ключи точек), диагностика ошибок через `logger`.

---

## Развитие и масштабирование (Roadmap)

### 1) Продуктовые вехи (0–3 месяца)
- Фаза 2 контент: расширение квестов «citizenship_invitation», «eyes_in_the_dark», «void_shards» (диалоги + outcome‑ключи).
- Система журналов квестов (UI): история шагов, активные цели, финалы.
- Репутация и отношения (UI): карта фракций, виджет отношений NPC.
- Улучшения карты: кластеры/тепловые слои, фильтры по типам точек, поиск точек.
- Экономика: базовая валюта, магазины (торговцы), цены, бартер (интерфейс + outcome‑ключи).

### 2) Технические основы масштаба
- Контент‑инструменты:
  - DSL/JSON‑схемы для диалогов и outcome‑регистров; валидация схемой (Zod/JSON Schema).
  - Editor‑прослойка (internal tool): предпросмотр ветвления и outcome‑эффектов.
- Тестирование:
  - Unit: outcome‑мапперы, хелперы `helpers/quest`, зависимости/требования.
  - Интеграция: потоки `resolvePoint → applyDialogOutcome` (Convex Test).
  - E2E: критические квестовые ветки (Playwright/Cypress).
- Наблюдаемость:
  - Структурные логи на сервере (traceId, deviceId, userId).
  - Метрики: время ответа `resolvePoint`, доля ошибок `applyDialogOutcome`, частота outcome‑ключей.
- CI/CD:
  - Lint/Typecheck/Test → Build → Preview Deploy.
  - Линт на «магические строки» (eslint rules) и запрет `any`/пустых catch.

### 3) Производительность и данные
- Индексы и кэш:
  - Уточнить индексы `quest_progress` (частые выборки by_user/by_device).
  - Кэш outcome‑реестра в памяти процесса (readonly snapshot).
- Платёжеспособность фронта:
  - Виртуализация списков квестов и точек.
  - «Тихие» подписки Convex (группировка, минимизация ререндеров).
- Масштабирование Convex:
  - Разделение «горячих» функций (QR/диалоги) и «bulk» задач (сидеры/бэкфилы) на actions/crons.

### 4) Безопасность и целостность
- Идемпотентность outcome:
  - Idempotency‑key (dialogInstanceId) для клиентских повторов.
  - Проверки предусловий на сервере (баланс/инвентарь/флаги) перед применением.
- Миграции данных:
  - Версионирование структур `player_state`/`quest_progress`; миграторы на Convex Migrations.
- Политики доступа:
  - Разделить public/internal функции; минимизировать поверхность API.

### 5) Оффлайн/сетевые сценарии
- Очередь исходов на клиенте (retry c backoff, idempotency‑key).
- «Soft‑read» для карты: кэш последнего успешного ответа `listVisible` в IndexedDB.

### 6) Интернационализация/локализация
- Ключи текста в диалогах → i18n каталоги (RU/EN);
- Форматирование дат/чисел, системы измерений.

### 7) Инструменты для дизайнеров
- «Сухой прогон» диалога: симуляция входных флагов/репутаций, автообход веток.
- Граф зависимостей квестов (Mermaid/Graphviz) из `quest_dependencies`.

### 8) Контентные риски и регрессии
- Линтер контента: валидировать ссылки `dialogKey`, `outcomeKey`, существование `questId`/`step`.
- Снэпшот‑тесты outcome‑реестра (детерминированная проверка diff).

### 9) Дорожная карта (этапы)
- Месяц 1: outcome‑реестр → инструменты валидации → журнал квестов.
- Месяц 2: экономика/магазины → репутация UI → кластеры карты.
- Месяц 3: редактор контента (простая панель), E2E‑покрытие ключевых веток.

### 10) Принципы разработки
- Сервер — единственный источник бизнес‑логики; клиент — Thin UI.
- Константы/схемы/хелперы централизованы; никаких `any` и «магических строк».
- Реактивные подписки вместо «гидраторов»; откат кэшированных данных при ошибках сети.

### Changelog (текущая сессия)
- Унификация выборки доступных квестов в `convex/quests.ts` через общую утилиту и единый `getAvailableQuests`.
- Оптимизация `mapPoints.listVisible`: выборка стартовых биндингов по индексам (`by_quest_start`), добавлено поле `isStart`.
- Централизованная инициализация сессии: `quests.initializeSession`; `QuestHydrator` переведён на единый вызов.
- Безопасные оптимистичные апдейты в `useQuest` с откатом снапшота при ошибке.
- Вынесение реестров в БД: `dialog_outcomes`, `dialog_actions`; добавлены сиды и резолверы (`dialogs.applyDialogOutcome`, `dialogs.resolveAction`).
- Выделена общая серверная реализация эффектов `applyOutcomeImpl` и переиспользована в диалогах.
- Укреплены типы: замена `(api as any)` на сгенерированные типы API в клиентских слоях.

