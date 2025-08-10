# QR-Boost Client — Путеводитель

Проект: фронтенд игры с картой, визуальной новеллой и квестами (QR-коды — позже). Стек: Vite + React + TypeScript + Tailwind v4 + React Router v7 + Mapbox GL + Convex.

## Быстрый старт

1) Установить зависимости:

```bash
npm i
```

2) Настроить переменные окружения (`.env.local`):

```env
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_CONVEX_URL=https://<from_convex>
CONVEX_DEPLOYMENT=<from_convex>
VITE_DEV_SEED_TOKEN=some_dev_secret # dev-only сид map_points
```

3) Запустить dev-сервер:

```bash
npm run dev
```

4) Инициализировать Convex (один раз/по надобности):

```bash
npx convex dev --once
```

## Навигация по кодовой базе (FSD)

- `src/app/` — провайдеры и инициализация приложения
  - `AppConvexProvider.tsx` — Convex React Provider
- `src/pages/` — страницы-роуты
  - `HomePage.tsx` — главная, кнопка старта VN
  - `NovelPage.tsx` — полноэкранная Visual Novel (`/novel`)
  - `MapPage.tsx` — карта (`/map`)
  - `QuestsPage.tsx` — список/создание квестов (Convex)
  - `SettingsPage.tsx` — dev-настройки/сброс
- `src/widgets/` — составные UI-модули
  - `MapWidget/MapWidget.tsx` — карта, маркеры и попапы
  - `MapWidget/ui/MapWidget.css` — стили попапов
- `src/entities/` — доменные сущности
  - `map-point/model/types.ts` — типы точек карты
  - `map-point/api/local.ts` — локальный API (localStorage)
  - `map-point/ui/MapMarker.tsx`, `MapPointTooltip.tsx` — UI-компоненты
- `src/shared/` — общие модули
  - `config/map.ts` — конфиг карты (центр, зум, bounds)
  - `types/core/mapPoint.ts` — базовые типы для карты
  - `storage/deliveryQuestDialogs.ts` — диалоги квеста «Доставка и дилемма»
  - `storage/loyaltyQuestDialogs.ts` — диалоги квеста «Разделённые Лояльности»
  - `storage/dialogs.ts` — реестр диалогов (единый источник истины)
  - `lib/convexClient.ts` — Convex React клиент
  - `lib/logger.ts` — унифицированное логирование (MAP/QUEST/DIALOG/SEED/STORE)

## Роутинг

- React Router v7 с lazy-роутами:
  - `/` — главная
  - `/novel` — визуальная новелла (полноэкранный лэйаут)
  - `/map` — карта
  - `/quests` — квесты (Convex)
  - `/settings` — настройки
- VN → Map: сцена `intro` в `scenarios.ts` содержит inline-экшен, который переводит на `/map?dialog=quest_start_dialog` для автопоказа стартового диалога квеста.

## Карта (Mapbox GL)

- Конфиг: `src/shared/config/map.ts` (читает `VITE_MAPBOX_TOKEN`)
- Стили Mapbox: импортированы в самом начале `src/index.css`:
  - `@import "mapbox-gl/dist/mapbox-gl.css";`
  - `@import "tailwindcss";`
- Виджет: `src/widgets/MapWidget/MapWidget.tsx`
  - Инициализация карты, контролы
  - Запрос точек с сервера: `mapPoints.listVisible({ userId|deviceId })`
  - Dev-фоллбэк: сид локально (`game-map-points`) только в dev
  - Маркеры: `mapboxgl.Marker({ anchor: 'bottom' })` — компактные, не «прыгают» при зуме
  - Попапы (`mapboxgl.Popup`) стилизованы через `MapWidget.css`
  - Автопоказ диалога по query-параметру `?dialog=<dialogKey>`

## Mappoints

- Базовые типы: `src/shared/types/core/mapPoint.ts`
- Типы сущностей: `src/entities/map-point/model/types.ts`
- Локальный API: `src/entities/map-point/api/local.ts`
- UI (готово к интеграции через порталы): `MapMarker`, `MapPointTooltip`
  
Загрузка демо-точек: сидер `map-point/api/seed.ts` (dev) добавляет недостающие точки локально. Серверный сид — `/settings` → «Отправить демо-точки в Convex» (dev-only, требует `VITE_DEV_SEED_TOKEN`). Все координаты в `bounds` города.

## Convex

- Схема: `convex/schema.ts` — `map_points`, `quest_progress` (+ демо `quests`)
- Квесты: `convex/quests.ts`
  - `getProgress({ userId?, deviceId? })`, `start/advance/complete`
  - `migrateDeviceProgressToUser(deviceId, userId)`
- Точки: `convex/mapPoints.ts`
  - `listVisible({ userId?, deviceId? })`, `listAll()`
  - `upsertManyDev(points, devToken)` — dev-сид на сервер
- Auth: `convex/auth.ts: me()` — отдаёт `userId` при настроенном провайдере
- Клиент: `shared/lib/convexClient.ts` + `AppConvexProvider` + `QuestHydrator`

## Visual Novel

- Движок:
  - `entities/visual-novel/ui/GameEngine.tsx` + parts (`Background`, `CharacterSprites`, `DialogueBox`, `ChoiceMenu`, `GameUI`)
  - Стор: `entities/visual-novel/model/store.ts` (Zustand)
  - Хуки: `useGameState`, `useSaveSystem`, `useSceneEngine`
  - Сценарии: `entities/visual-novel/api/scenarios.ts`
- Особенности:
  - Полноэкранный лэйаут `/novel` без рамок
  - Inline-экшены в `DialogueItem` (переход на карту с автодиалогом)
  - Сохранения в `localStorage` (`vn_save_*`), сброс в `/settings`

### Поток VN → Квесты
- Вступление (VN `intro`) заканчивается строкой с экшеном, который переводит на `/map?dialog=quest_start_dialog` и запускает квест «Доставка и дилемма».
- После прохождения доставки на карте появляется точка FJR «Пункт FJR» (старт квеста «Разделённые Лояльности»).
- После принятия поручения FJR отображается точка «Дыра» (анархисты) для продолжения квеста лояльности.

## Прогресс квестов

- Источник истины — Convex (`quest_progress`), Zustand — кэш/persist
- `QuestHydrator` поднимает прогресс из Convex при старте (если локально пусто)
- Обработка `action` из диалогов — через `features/quest-progress/model/actionCoordinator`
- Диалоговые `condition` поддерживаются; проверки на основе стора игрока (`entities/player`)
- `/settings`:
  - «Синхронизировать прогресс квестов с Convex» — разовая отправка локального состояния на сервер
  - «Миграция device → user (dev)» — перенос прогресса при появлении real `userId`

### Ключевые точки на карте (демо)
- `settlement_center` — Городской центр (старт доставки)
- `trader_camp` — Лагерь торговца
- `workshop_center` — Мастерская Дитера
- `northern_anomaly` — Аномальная зона
- `fjr_office_start` — Пункт FJR (после завершения доставки)
  - координаты: lng 7.8509922034320425, lat 47.99679276901679
- `anarchist_hole` — «Дыра», квартал анархистов (после принятия поручения FJR)
  - координаты: lng 7.852047469737187, lat 47.99385334623585

### Отладка
- В консоль выводятся шаги и фильтрованные точки:
  - `MAP Current quest step: <step> completedQuests: [...] loyaltyStep: <step>`
  - `Filtered points by step <step> → ids: [ ... ]`
  - События стора: `STORE startQuest/advanceQuest/completeQuest`

## Tailwind v4

- Все `@import` идут в самом начале `src/index.css` (иначе PostCSS упадёт)
- Токены темы на `@theme` (пример в `index.css`)

## Полезные команды

```bash
npm run dev      # Dev-сервер
npm run build    # Production сборка
npm run preview  # Локальный предпросмотр сборки
npx convex dev   # Dev-сервер Convex (без --yes)
```

## Частые проблемы

- «No HydrateFallback…»: добавлен `fallbackElement` в `RouterProvider` — предупреждение исчезает.
- «Missing mapbox-gl.css»: стили Mapbox импортируются первыми в `src/index.css`.
- «@import must precede…»: директивы `@import` должны быть первыми в CSS (Tailwind v4).

## Дальнейшие шаги

- Интеграция Convex Auth/Better Auth (реальный `userId`)
- Тесты (юнит/интеграция/E2E): `decideDialogKey`, `conditions`, `listVisible`
- Полностью опираться на серверную фильтрацию `listVisible` в prod
- Подключить аудио/анимации (framer-motion/howler)

