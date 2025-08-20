
## Архитектура: Карта и Квесты (v2)

### 1) Бэкенд (Convex): мозг и хранилище
- Файлы: `client/convex/quests.ts`, `client/convex/quests.helpers.ts`, `client/convex/mapPoints.ts`, `client/convex/seed.ts`, `client/convex/schema.ts`.
- Истина данных: таблицы `map_points`, `mappoint_bindings`, `quest_registry`, `quest_dependencies`, `quest_progress`, `player_state`, `world_state`, `users`.
- Доступные функции:
  - Квесты: `getAvailableQuests`, `getAvailableQuestsForNpc`, `getAvailableBoardQuests`, `getProgress`, `startQuest`, `advanceQuest`, `completeQuest`, `bootstrapNewPlayer`, `finalizeRegistration`, `getPlayerState`, `setPlayerPhase`, `getWorldState`, `setWorldPhase`, `applyOutcome`, `migrateDeviceProgressToUser`, `upsertQuestRegistry`.
  - Карта: `mapPoints.listVisible` (гео‑окно + фильтр по фазам/требованиям/зависимостям), `mapPoints.listAll`, `mapPoints.upsertManyDev`.
  - Seed (dev): `seed.seedQuestRegistryDev`, `seed.seedQuestDependenciesDev`, `seed.seedMappointBindingsDev`, `seed.seedQrCodesDev`.
- Хелперы: `computeAvailableQuests`, `filterQuestsByRequirements`, `loadQuestDependencies`, `dependenciesSatisfied`, `isQuestAllowedByPhase`, `pickWinnerProgress`.

### 2) Слой данных фронтенда: мост карта↔сервер
- Файл: `client/src/widgets/MapWidget/model/useVisiblePoints.ts`.
- Поведение:
  - Извлекает bbox из `mapbox.getBounds()` и запрашивает `mapPoints.listVisible({ deviceId })`.
  - Обновляет точки при `moveend`/`zoomend`, выполняет минимальный дебаунс через `requestAnimationFrame`.
  - Возвращает список `VisibleMapPoint`.

### 3) Слой отображения: визуальный движок
- Файл: `client/src/widgets/MapWidget/model/useMarkers.tsx`.
- Поведение:
  - Источники: `mappoints` (circle), слой подсветки `tracked-glow`.
  - Синхронизация данных слоя с массивом точек.
  - Обработчик клика: открытие досок/NPC/диалогов; подсветка пульсирует аниматором.
  - Очистка ресурсов аниматора и обработчиков при unmount.

### 4) Свод правил видимости
- Файлы: `client/src/widgets/MapWidget/model/visibilityRules.ts`, тесты `visibilityRules.test.ts`.
- Декларативные правила для id‑ов и состояний (`phase`, `deliveryStep`).
- Фоллбэк на `settlement_center` только до старта доставки.

## Поток событий (Gameplay Loop)

### Событие: Game_Start
- Action: Play_Cutscene('cs_arrival') — прибытие на дрезине.
- Action: Player.SetState('status','refugee'), Player.SetAttribute('fame',0), Player.Inventory.AddItem('item_canned_food',1) — выполняется через `quests.bootstrapNewPlayer({ deviceId })`.

### Этап 1: Пролог — выдача PDA и старт диалога
- Event: Cutscene_End → показываем карту, на ней виден `settlement_center`.
- Action: Dialogue_Manager.Start('grant_pda_node') — запускается стартовый диалог (ключ можно сопоставить/заменить в `storage/dialogs`).
- Event: Dialogue_End('prologue_check') → Action: Quest_Manager.StartQuest('delivery_and_dilemma') через `quests.startQuest`.

### Навигация по квесту доставки
- После старта показывается `trader_camp` и слой `tracked-glow` указывает на активную цель.
- Затем `workshop_center`, после получения артефакта — возврат и завершение `completeQuest`.

### Регистрация и создание персонажа
- Аутентификация через Clerk.
- После успешного логина открыть модал создания персонажа (иконка, ник).
- По подтверждению вызвать `quests.finalizeRegistration({ deviceId, nickname, avatarKey })`:
  - Привязка прогресса к пользователю, установка `player_state.phase = 1`, `world_state.phase = 1`.
  - После этого фронтенд видит точки фазы 1 по биндингам из `seed.ts`.

## Checklist внедрения
- [ ] seed: выполнить `seedQuestRegistryDev`, `seedQuestDependenciesDev`, `seedMappointBindingsDev`, `seedQrCodesDev`.
- [ ] Вызов `bootstrapNewPlayer` на первом запуске.
- [ ] Триггер кат‑сцены и старт диалога `grant_pda_node` после загрузки карты.
- [ ] По завершению диалога — `startQuest('delivery_and_dilemma')`.
- [ ] UI регистрации Clerk → модал создания персонажа → `finalizeRegistration`.
- [ ] Визуальная подсветка `tracked-glow` активной цели квеста.

## Логика карты и маркеров (Mapbox GL)

### Этап 1. Источник данных (Source)
- Создаётся один источник `mappoints` типа `geojson` с пустым `FeatureCollection` и `promoteId: 'id'`.
- Источник — единый буфер данных, который заполняется из полученного массива `points` при каждом обновлении.

### Этап 2. Слои отображения (Layers)
- Слой `mappoints` (type: `circle`) — базовые маркеры.
  - `circle-radius`: 7
  - `circle-color`: через выражение `['match', ['get','type'], ...]` для динамических цветов по типам (`settlement`, `npc`, `board`, `anomaly`, fallback).
  - `circle-stroke-color`: `#111827`, `circle-stroke-width`: `1.5`, `circle-opacity`: `0.95`.
- Слой `tracked-glow` (type: `circle`) — подсветка отслеживаемой цели.
  - `circle-radius`: 10, `circle-blur`: 0.4, `circle-opacity`: 0.9, цвет полупрозрачный золотой.
  - Изначально скрыт фильтром `['==',['get','id'],'__none__']`.

### Этап 3. Обновление данных и фильтрация
- Преобразование `points` → GeoJSON features: геометрия `Point`, свойства: `id`, `title`, `type`, `dialogKey`, `eventKey`, `npcId`, `description`, `isActive`, `isDiscovered`, `lat`, `lng`.
- `source.setData` перезаписывает данные источника — быстрый и эффективный путь обновить карту.
- Видимость слоя `mappoints` управляется через `map.setFilter('mappoints', ['in',['get','id'], ['literal', visibleIds]])`, где `visibleIds` возвращает `resolveVisibleIds(points, { phase, deliveryStep })`.
- Подсветка цели `tracked-glow` управляется фильтром `['==',['get','id'], trackedTargetId]` (или скрыта, если цель отсутствует/невидима).

### Этап 4. Интерактивность (Handlers)
- События навешиваются на слой `mappoints`:
  - `click`: открывает борды/NPC или диалог, используя свойства feature.
  - `mouseenter`: меняет курсор, создаёт React‑tooltip (`MapPointTooltip`) и Popup (`mapboxgl.Popup`), привязывает его к координатам feature.
  - `mouseleave`: безопасно убирает курсор и откладывает удаление Popup/Unmount Root через `setTimeout(..., 0)`.
- Ссылки на обработчики сохраняются, на `cleanup` снимаются `map.off` по тем же ссылкам.

### Этап 5. Анимация подсветки
- Аниматор на `requestAnimationFrame`: периодически меняет `circle-radius` и `circle-opacity` у слоя `tracked-glow` через `map.setPaintProperty` для эффекта пульсации.
- На `cleanup` аниматор останавливается через `cancelAnimationFrame`.

### Этап 6. Очистка и безопасность
- В `cleanup` эффекта:
  - Снятие всех обработчиков слоёв `map.off`.
  - Остановка анимации.
  - Защитное удаление Popup (`hoverPopupRef.remove()`) и размонтирование React Root (`hoverTooltipRootRef.unmount()`), затем `null` в рефах.
- Очистка сделана идемпотентной и не зависит от того, были ли события `mouseenter/leave`.

