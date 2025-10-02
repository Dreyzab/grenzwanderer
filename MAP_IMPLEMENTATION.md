# MapPage Implementation Guide

## 📋 Обзор реализации

Полностью функциональная система карты согласно FSD архитектуре из Plan.md. Реализовано:

✅ **Entity Layer** - map-point с типами, store, UI компонентами
✅ **Convex Backend** - API для точек карты и системы исследований
✅ **Shared API** - React хуки для Convex интеграции
✅ **Page Layer** - MapPage с фильтрами, панелями и контролами
✅ **Геолокация** - Интеграция с существующей системой
✅ **Система статусов** - not_found → discovered → researched

## 🏗️ Структура файлов

```
client/
├── src/
│   ├── entities/map-point/           # Entity layer
│   │   ├── model/
│   │   │   ├── types.ts             # Типы MapPoint, статусы, фильтры
│   │   │   └── store.ts             # Zustand store с persist
│   │   ├── ui/
│   │   │   ├── MapPointMarker.tsx   # Маркер на карте
│   │   │   └── MapPointCard.tsx     # Карточка в списке
│   │   ├── lib/
│   │   │   └── distanceCalc.ts      # Haversine формула
│   │   └── index.ts                 # Exports
│   │
│   ├── pages/MapPage/                # Page layer
│   │   ├── MapPage.tsx              # Основная страница
│   │   ├── model/
│   │   │   └── useMapState.ts       # Состояние страницы
│   │   ├── ui/
│   │   │   ├── MapControls.tsx      # Кнопки управления
│   │   │   ├── LocationFilters.tsx  # Панель фильтров
│   │   │   └── PointsListPanel.tsx  # Боковая панель точек
│   │   └── index.ts                 # Exports
│   │
│   └── shared/api/mapPoints/         # Shared API
│       └── convex.ts                # React хуки для Convex
│
└── convex/
    ├── schema.ts                     # + point_discoveries таблица
    └── mapPoints.ts                  # API функции (queries/mutations)
```

## 🚀 Основные возможности

### 1. Интерактивная карта
- **Mapbox GL JS** интеграция с fallback на CartoDB
- **Responsive маркеры** с кастомными React компонентами
- **Zoom, Pan, Navigation** контролы
- **Геолокация** с кнопкой "Найти меня"

### 2. Система точек карты
- **Типы**: POI, Quest, NPC, Location
- **Статусы**: Not Found → Discovered → Researched
- **Фильтрация** по типу, статусу, поиску
- **Сортировка** по расстоянию, названию, типу, статусу

### 3. Управление состоянием
- **Zustand store** с localStorage persistence
- **Convex real-time** синхронизация
- **Optimistic updates** для мгновенного отклика

### 4. UI/UX
- **Боковая панель** со списком точек (сворачиваемая)
- **Фильтры** с раскрывающейся панелью
- **Маркеры** с цветовым кодированием по статусу
- **Карточки точек** с действиями и информацией

## 📊 Технические детали

### Типы точек карты

```typescript
type MapPointType = 'poi' | 'quest' | 'npc' | 'location'
type MapPointStatus = 'not_found' | 'discovered' | 'researched'

interface MapPoint {
  id: string
  title: string
  description: string
  coordinates: { lat: number; lng: number }
  type: MapPointType
  status?: MapPointStatus
  phase?: number
  isActive: boolean
  // ... дополнительные поля
}
```

### Convex API

#### Queries:
- `listVisible` - получить видимые точки в bbox
- `getPointsInRadius` - точки в радиусе от позиции
- `getDiscoveryStats` - статистика исследований

#### Mutations:
- `markResearched` - пометить точку как исследованную

### React хуки

```typescript
// Получить видимые точки
const data = useVisibleMapPoints({ bbox, phase, limit })

// Пометить как исследованную
const markResearched = useMarkResearched()
await markResearched(pointKey)

// Получить статистику
const stats = useDiscoveryStats()
```

### Geolocation интеграция

```typescript
const { position, getCurrentPosition } = useGeolocation({
  accuracy: 'high',
  watch: false,
})

// Обновление позиции пользователя
useEffect(() => {
  if (position) {
    setUserLocation({ lat: position.lat, lng: position.lng })
  }
}, [position])
```

## 🎨 Стилизация

### Цветовое кодирование

**По статусу:**
- 🔵 **Обнаружена** (discovered) - синий
- 🟢 **Исследована** (researched) - зелёный
- ⚪ **Не найдена** (not_found) - серый

**По типу:**
- 🔷 POI - синий
- 🟣 Quest - фиолетовый
- 🟡 NPC - жёлтый
- 🟢 Location - зелёный

### Dark Cyberpunk Theme
- Фоны: `bg-zinc-900/80 backdrop-blur-sm`
- Границы: `border-zinc-700`
- Текст: `text-zinc-100` / `text-zinc-400`
- Акценты: `text-emerald-400`, `text-blue-400`

## 🔧 Конфигурация

### Environment Variables

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

Без токена используется fallback CartoDB карта.

### Map Center (Freiburg)

```typescript
const FREIBURG_CENTER: [number, number] = [7.8421, 47.9990]
```

## 📱 Responsive Design

- **Desktop**: Полная панель слева (384px)
- **Mobile**: Панель скрывается, кнопка открытия
- **Touch-friendly**: Все элементы >= 44px

## 🔄 Data Flow

```
User Action → MapPage Component
    ↓
Store Update (Zustand) → Optimistic UI
    ↓
Convex Mutation/Query → Backend
    ↓
Real-time Update → Store Sync
    ↓
Re-render with new data
```

## 🚦 Routing

```typescript
// client/src/main.tsx
<Route path="/map" element={<MapPage />} />
<Route path="/enhanced-map" element={<MapPage />} />
```

Доступ: `http://localhost:5173/map`

## 🎯 Следующие шаги (из Plan.md Фаза 5)

### Запланировано:

1. **Path Tracking** (`features/path-tracking/`)
   - useRouteRecorder для записи перемещений
   - Douglas-Peucker компрессия
   - Геофенсинг через геохеш

2. **Zone Discovery** (`features/zone-discovery/`)
   - commitTrace API для обнаружения точек
   - Автоматическое обновление статусов

3. **POI Inspection** (`features/poi-inspection/`)
   - QR сканирование для исследования
   - Интеграция с наградами

## 📖 Использование

### Добавление точки на карту

```typescript
// В Convex функции или seed данных
await ctx.db.insert('map_points', {
  id: 'freiburg-munster',
  title: 'Freiburger Münster',
  description: 'Готический собор в центре Фрайбурга',
  coordinates: { lat: 47.9959, lng: 7.8522 },
  type: 'poi',
  phase: 1,
  isActive: true,
  createdAt: Date.now(),
})
```

### Пометка как исследованной

```typescript
const markResearched = useMarkResearched()

const handleResearch = async (pointKey: string) => {
  try {
    await markResearched(pointKey)
    // Success!
  } catch (error) {
    console.error('Failed to mark as researched:', error)
  }
}
```

## 🐛 Troubleshooting

### Mapbox token не работает
- Проверьте `.env.local` файл
- Используется fallback CartoDB карта автоматически

### Маркеры не отображаются
- Проверьте `isMapLoaded` флаг
- Убедитесь что точки в `map_points` таблице
- Проверьте `isActive: true` на точках

### Геолокация не работает
- Проверьте разрешения браузера
- HTTPS требуется для геолокации
- Используйте кнопку "Найти меня"

## 📚 Документация

- [Plan.md](../../Plan.md) - Полная архитектура проекта
- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [Zustand Docs](https://docs.pmnd.rs/zustand/)
- [Convex Docs](https://docs.convex.dev/)

---

**Статус**: ✅ Полностью реализовано и готово к использованию
**Версия**: 1.0.0
**Дата**: October 2025

