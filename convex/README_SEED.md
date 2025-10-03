# 🗺️ Управление Map Points

## Команды для сидирования данных

### 1. Создать точки карты (первый раз)
```bash
npx convex run mapPointsSeed:seedMapPoints
```

### 2. Очистить все точки
```bash
npx convex run mapPointsSeed:clearMapPoints
```

### 3. Пересоздать точки (очистка + создание)
```bash
npx convex run mapPointsSeed:reseedMapPoints
```

## Структура точек

### 🏕️ Временный лагерь
- **synthesis_camp_storage** - Склад "Синтеза" с припасами

### 🔧 Мастерские
- **workshop_center** - Мастерская Дитера (центральная)
- **carl_private_workshop** - Мастерская Карла "Шестерёнки"

### 🏥 Медицинские точки
- **synthesis_medical_center** - Медпункт "Синтеза"

### ⚔️ Военные структуры (FJR)
- **fjr_board** - Доска объявлений FJR
- **fjr_briefing_point** - Брифинг FJR

### 🏛️ Религиозные точки
- **old_believers_square** - Центральная площадь (Отец Иоанн)

### 🏴‍☠️ Анархистские точки
- **anarchist_hole** - «Дыра» (свободная зона)
- **anarchist_arena_basement** - Подвал Арены (Заклёпка)

### 🎭 Развлекательные точки
- **quiet_cove_bar** - Бар "Тихая Заводь" (Люда)

### ⚗️ Аномальные зоны
- **northern_anomaly** - Северная аномальная зона

## Типы точек

- **poi** - Point of Interest (обычная точка интереса)
- **npc** - NPC персонаж (для диалогов)
- **quest** - Квестовая точка
- **location** - Локация
- **board** - Доска объявлений
- **settlement** - Поселение
- **anomaly** - Аномальная зона

## Статусы точек

1. **not_found** - Не обнаружена (скрыта от игрока)
2. **discovered** - Обнаружена (видна на карте, можно исследовать)
3. **researched** - Исследована (полный доступ ко всем функциям)

## Фазы игры

- **Phase 1** - Начальная фаза (большинство точек)
- **Phase 2** - Продвинутая фаза (анархисты, аномалии)

## Метаданные точек

Каждая точка может содержать:

- **category** - Категория точки
- **faction** - Принадлежность к фракции
- **services** - Доступные услуги
- **npcId** - ID персонажа
- **dialogues** - Доступные диалоги
- **questBindings** - Связанные квесты
- **atmosphere** - Описание атмосферы
- **danger_level** - Уровень опасности
- **relationship** - Параметры отношений с NPC
- **tradeOptions** - Торговые возможности
- **hazards** - Опасности (для аномалий)
- **rewards** - Награды (для аномалий)

## Примеры использования

### Получить все точки на карте
```typescript
const points = await ctx.runQuery(api.mapPoints.listVisible, {
  deviceId: 'your-device-id',
  phase: 1
})
```

### Исследовать точку
```typescript
const result = await ctx.runMutation(api.mapPoints.markResearched, {
  deviceId: 'your-device-id',
  pointKey: 'workshop_center'
})
```

### Получить точки в радиусе
```typescript
const nearby = await ctx.runQuery(api.mapPoints.getPointsInRadius, {
  lat: 48.0015,
  lng: 7.855,
  radiusKm: 0.5,
  type: 'npc'
})
```

## Интеграция с игровыми системами

### Связь с NPC
Точки типа `npc` содержат:
- `npcId` - уникальный ID персонажа
- `characterName` - имя персонажа
- `dialogues` - доступные диалоги
- `relationship` - параметры отношений

### Связь с квестами
Через таблицу `mappoint_bindings`:
- Точка может начинать квест (`start`)
- Точка может продвигать квест (`progress`)
- Точка может завершать квест (`complete`)

### Связь с фракциями
Каждая точка может принадлежать фракции:
- `synthesis` - Синтез
- `fjr` - Вольные егеря
- `old_believers` - Старообрядцы
- `anarchists` - Анархисты
- `neutral` - Нейтральная

## Проверка данных

После сидирования проверьте:
```bash
# Получить количество точек
npx convex run mapPoints:listVisible '{"phase": 1}' --json

# Проверить конкретную точку
npx convex run mapPoints:getPointsInRadius '{"lat": 48.0015, "lng": 7.855, "radiusKm": 0.1}' --json
```



