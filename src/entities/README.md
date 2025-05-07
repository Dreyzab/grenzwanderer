# Модуль Entities

Здесь определяются основные бизнес-сущности приложения: типы, сторы, модели, взаимодействие с данными. Entities — это фундаментальные объекты (например, пользователь, маркер, квест), которые используются в features и widgets.

## Структура модуля

```
entities/
  ├── items/          # Сущность предметов
  │   ├── model/      # Модели и типы предметов
  │   │   └── items.ts
  │   └── index.ts    # Публичное API модуля
  │
  ├── markers/        # Сущность маркеров на карте
  │   ├── model.ts    # Модель маркеров (сторы, события, типы)
  │   └── index.ts    # Публичное API модуля
  │
  ├── player/         # Сущность игрока
  │   ├── model/      # Модели игрока 
  │   │   ├── playerAttributes.ts
  │   │   └── playerSkills.ts
  │   └── index.ts    # Публичное API модуля
  │
  ├── scene/          # Сущность сцены визуальной новеллы
  ├── shelter/        # Сущность убежища
  ├── shops/          # Сущность магазинов
  └── user/           # Сущность пользователя
```

## Принципы организации

1. **Изоляция**: Каждая сущность полностью инкапсулирует свою бизнес-логику
2. **Публичное API**: Каждая сущность имеет четко определенное публичное API через index.ts
3. **Независимость**: Entities не должны зависеть от features или других слоев более высокого уровня

## Рекомендации по использованию

### Правильно

```typescript
// Импорт через публичное API
import { MarkerType, showMarker } from '../../entities/markers';
```

### Неправильно

```typescript
// Импорт напрямую из модели, минуя публичное API
import { MarkerType } from '../../entities/markers/model';
```

## Типы и константы

Определения перечислений, интерфейсов и констант выносятся в shared/types и shared/constants для предотвращения циклических зависимостей:

```typescript
// src/shared/types/marker.types.ts
export enum MarkerType { ... }
export interface MarkerData { ... }

// src/entities/markers/model.ts
import { MarkerType, MarkerData } from '../../shared/types/marker.types';
```

## Состояние

Для управления состоянием используется библиотека Effector:

```typescript
// src/entities/markers/model.ts
import { createStore, createEvent } from 'effector';
import { MarkerData } from '../../shared/types/marker.types';

// События
export const showMarker = createEvent<string>();
export const hideMarker = createEvent<string>();

// Хранилище
export const $markers = createStore<MarkerData[]>([])
  .on(showMarker, (state, id) => /* обработчик */)
  .on(hideMarker, (state, id) => /* обработчик */);
``` 