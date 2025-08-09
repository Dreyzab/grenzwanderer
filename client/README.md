# QR-Boost Client — Путеводитель

Проект: фронтенд игры с картой, квестами и QR-кодами. Стек: Vite + React + TypeScript + Tailwind v4 + React Router v7 + Mapbox GL + Convex.

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
  - `MapPage.tsx` — страница с картой (`/map`)
  - `QuestsPage.tsx` — список/создание квестов с Convex
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
  - `storage/deliveryQuestDialogs.ts` — сиды диалогов квеста
  - `lib/convexClient.ts` — Convex React клиент

## Роутинг

- React Router v7 с lazy-роутами:
  - `/` — главная
  - `/map` — карта
  - `/quests` — квесты (Convex query/mutation)
- В `RouterProvider` используется `fallbackElement` для корректной гидратации.

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

## Mappoints

- Базовые типы: `src/shared/types/core/mapPoint.ts`
- Типы сущностей: `src/entities/map-point/model/types.ts`
- Локальный API: `src/entities/map-point/api/local.ts`
- UI (готово к интеграции через порталы): `MapMarker`, `MapPointTooltip`

Загрузка демо-точек: сохраните массив точек под ключом `game-map-points` в `localStorage` — виджет карты их подхватит автоматически.

## Convex

- Схема: `convex/schema.ts`
- Функции: `convex/quests.ts` (list/create)
- Клиент: `src/shared/lib/convexClient.ts` + провайдер
- Страница `/quests` показывает пример запроса/мутации

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

- Перевести маркеры на React-порталы с `MapMarker`/`MapPointTooltip` и кликовой логикой
- Фильтрация точек по активным квестам (интеграция с `deliveryQuestDialogs.ts`)
- Синхронизация mappoints с Convex (сервер — источник истины, localStorage — кеш)

