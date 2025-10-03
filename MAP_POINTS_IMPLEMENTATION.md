# 🗺️ Реализация системы Map Points для Grenzwanderer

## ✅ Что реализовано

### 1. **Расширенная схема данных (Convex)**

#### Новые типы точек:
- `poi` - Point of Interest
- `quest` - Квестовые точки
- `npc` - NPC персонажи
- `location` - Локации
- `board` - Доски объявлений ⭐ НОВОЕ
- `settlement` - Поселения ⭐ НОВОЕ
- `anomaly` - Аномальные зоны ⭐ НОВОЕ

#### Файлы:
- `client/convex/schema.ts` - Обновлена схема map_points
- `client/convex/mapPointsSeed.ts` - Сидирование 12+ точек карты

### 2. **TypeScript типы (Client-side)**

#### Расширенные типы:
```typescript
// client/src/entities/map-point/model/types.ts
- MapPointType (7 типов)
- MapPointCategory (10 категорий)
- FactionType (5 фракций)
- ServiceType (22 типа услуг)
- MapPointMetadata (детальные метаданные)
```

#### Категории точек:
- **Торговые**: storage, workshop
- **Медицинские**: medical
- **Военные**: bulletin_board, briefing_point
- **Религиозные**: religious
- **Анархистские**: anarchist_zone, hideout
- **Социальные**: bar
- **Опасные**: anomaly

### 3. **UI Компоненты**

#### MapPointMarker (обновлен)
- Поддержка 7 типов маркеров
- Цветовая кодировка по уровню опасности
- Пульсирующие эффекты для опасных зон
- Индикаторы статуса (not_found, discovered, researched)

#### MapPointDetails (новый)
- Детальный просмотр точки
- Отображение метаданных (атмосфера, фракция, NPC)
- Список доступных услуг
- Информация об опасностях и наградах
- Требования доступа и репутация
- Кнопки действий (исследовать, поговорить, торговать)

### 4. **Hooks и логика взаимодействия**

#### useMapPointInteraction
```typescript
// client/src/entities/map-point/lib/useMapPointInteraction.ts
- researchPoint() - Исследование точки
- checkAccessibility() - Проверка доступности
- getAvailableActions() - Доступные действия
- getDangerInfo() - Информация об опасности
- checkEquipment() - Проверка снаряжения
```

### 5. **Данные точек карты**

#### 🏕️ Временный лагерь
- **synthesis_camp_storage** - Склад "Синтеза"

#### 🔧 Мастерские (2 точки)
- **workshop_center** - Мастерская Дитера (центральная)
- **carl_private_workshop** - Мастерская Карла "Шестерёнки"

#### 🏥 Медицина (1 точка)
- **synthesis_medical_center** - Медпункт "Синтеза"

#### ⚔️ Военные FJR (2 точки)
- **fjr_board** - Доска объявлений
- **fjr_briefing_point** - Брифинг FJR

#### 🏛️ Религия (1 точка)
- **old_believers_square** - Отец Иоанн

#### 🏴‍☠️ Анархисты (2 точки)
- **anarchist_hole** - «Дыра» (свободная зона)
- **anarchist_arena_basement** - Подвал Арены (Заклёпка)

#### 🎭 Развлечения (1 точка)
- **quiet_cove_bar** - Бар "Тихая Заводь" (Люда)

#### ⚗️ Аномалии (1 точка)
- **northern_anomaly** - Северная аномальная зона

**ИТОГО: 12 точек карты**

## 🎯 Связи с игровыми системами

### Связь с NPC
```typescript
metadata: {
  npcId: 'dieter_craftsman',
  characterName: 'Дитер "Молот"',
  dialogues: ['craftsman_meeting_dialog'],
  relationship: {
    initialLevel: 0,
    maxLevel: 100
  }
}
```

### Связь с квестами
```typescript
metadata: {
  questBindings: ['craftsman_quest_chain'],
  dialogues: ['field_medicine_quest']
}
```

### Связь с фракциями
```typescript
metadata: {
  faction: 'synthesis' | 'fjr' | 'old_believers' | 'anarchists',
  requiresFaction: 'fjr',
  minReputation: 20
}
```

### Сервисы и функциональность
```typescript
metadata: {
  services: ['repair', 'crafting', 'upgrade'],
  tradeOptions: {
    blackMarket: true,
    stolenGoods: true
  }
}
```

## 📦 Использование

### 1. Сидирование данных
```bash
# Создать точки в базе
npx convex run mapPointsSeed:seedMapPoints

# Очистить точки
npx convex run mapPointsSeed:clearMapPoints

# Пересоздать
npx convex run mapPointsSeed:reseedMapPoints
```

### 2. Получение точек
```typescript
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

const points = useQuery(api.mapPoints.listVisible, {
  deviceId: 'your-device-id',
  phase: 1,
  bbox: { minLat, maxLat, minLng, maxLng }
})
```

### 3. Исследование точки
```typescript
import { useMapPointInteraction } from '@/entities/map-point/lib/useMapPointInteraction'

const { researchPoint } = useMapPointInteraction()

await researchPoint(point)
```

### 4. Использование компонентов
```tsx
import { MapPointMarker } from '@/entities/map-point/ui/MapPointMarker'
import { MapPointDetails } from '@/entities/map-point/ui/MapPointDetails'

<MapPointMarker
  type={point.type}
  status={point.status}
  dangerLevel={point.metadata?.danger_level}
  onClick={() => selectPoint(point)}
/>

<MapPointDetails
  point={selectedPoint}
  distance={calculateDistance(userLocation, point.coordinates)}
  onClose={() => setSelectedPoint(null)}
  onInteract={handleInteract}
/>
```

## 🔄 Статусы точек

1. **not_found** - Точка еще не обнаружена
   - Не отображается на карте
   - Требует proximity detection или path tracking

2. **discovered** - Точка обнаружена
   - Отображается на карте
   - Можно просмотреть базовую информацию
   - Доступна кнопка "Исследовать"

3. **researched** - Точка исследована
   - Полный доступ ко всем функциям
   - Можно взаимодействовать с NPC
   - Доступны квесты и торговля

## 🎨 Визуальные особенности

### Цветовая схема маркеров:
- **Обычные**: серый (not_found), синий (discovered), зеленый (researched)
- **Опасные зоны**:
  - Желтый (low danger)
  - Оранжевый (medium danger)
  - Красный (high danger)
  - Фиолетовый (extreme danger)

### Анимации:
- Пульсация при выборе точки
- Пульсация для опасных зон (high/extreme)
- Hover эффекты

## 📋 Следующие шаги

### Требуется реализовать:

1. **Запустить seed команду**
   ```bash
   npx convex run mapPointsSeed:seedMapPoints
   ```

2. **Интеграция с картой**
   - Добавить MapPointDetails в MapWidget
   - Подключить useMapPointInteraction
   - Реализовать клики по маркерам

3. **Связь с диалогами**
   - Подключить metadata.dialogues к визуальной новелле
   - Создать триггеры для запуска диалогов

4. **Связь с квестами**
   - Создать записи в mappoint_bindings
   - Реализовать активацию квестов из точек

5. **Система фракций**
   - Реализовать проверку репутации
   - Добавить бонусы от отношений с NPC

## 🐛 Известные проблемы

- Требуется проверка линтера для новых файлов
- Нужно протестировать отображение на реальной карте
- Требуется создать bindings для квестов

## 📚 Документация

- `client/convex/README_SEED.md` - Подробная документация по сидированию
- `client/MAP_POINTS_IMPLEMENTATION.md` - Этот файл
- `Plan.md` - Общий план проекта (обновлен)

---

**Статус**: ✅ Базовая реализация завершена, требуется интеграция и тестирование


