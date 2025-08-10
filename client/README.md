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
  - Загрузка точек из `localStorage` (`game-map-points`)
  - Маркеры: `mapboxgl.Marker({ anchor: 'bottom' })` — компактные, не «прыгают» при зуме
  - Попапы (`mapboxgl.Popup`) стилизованы через `MapWidget.css`
  - Автопоказ диалога по query-параметру `?dialog=<dialogKey>`

## Mappoints

- Базовые типы: `src/shared/types/core/mapPoint.ts`
- Типы сущностей: `src/entities/map-point/model/types.ts`
- Локальный API: `src/entities/map-point/api/local.ts`
- UI (готово к интеграции через порталы): `MapMarker`, `MapPointTooltip`
  
Загрузка демо-точек: сидер `map-point/api/seed.ts` добавляет недостающие точки. Все координаты находятся в `bounds` города (см. `shared/config/map.ts`).

## Convex

- Схема: `convex/schema.ts`
- Функции: `convex/quests.ts` (list/create)
- Клиент: `src/shared/lib/convexClient.ts` + провайдер
- Страница `/quests` показывает пример запроса/мутации

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

## Прогресс квестов

- Локальный прогресс «Доставка и дилемма» хранится в Zustand (`entities/quest/model/questStore.ts`).
- `MapWidget` фильтрует точки на основе шага квеста, фокусирует камеру на актуальной точке.
- После завершения квеста стартовая точка снова появляется; клик по ней запускает `loyalty_quest_start`.

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

- Связать VN и карту через единые флаги/состояние квестов (Convex)
- Синхронизация mappoints с Convex (сервер — источник истины, localStorage — кеш)
- Подключить аудио/анимации (framer-motion/howler)

