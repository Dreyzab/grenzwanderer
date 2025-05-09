# Widgets Module (`src/widgets`)

Этот каталог содержит композиционные компоненты пользовательского интерфейса, которые формируют целостные части приложения "Grenzwanderer". Виджеты объединяют UI-компоненты из shared и данные из entities для создания функциональных блоков интерфейса.

## Структура

-   **`/battle`**: Виджеты, связанные с боевой системой игры.
    -   `BattlefieldWidget.tsx`: Отображение игрового поля.
    -   `BattleHUDWidget.tsx`: Игровой HUD для отображения здоровья, маны и других показателей.
    -   `PlayerCardHandWidget.tsx`: Компонент для отображения карт в руке игрока.

-   **`/character`**: Виджеты для отображения информации о персонаже.
    -   `CharacterSheet.tsx`: Компонент для отображения характеристик персонажа, навыков и атрибутов.

-   **`/VisualNovel`**: Виджеты для системы визуальной новеллы.
    -   `DialogueBoxWidget.tsx`: Компонент диалогового окна с анимацией текста.
    -   `CharacterDisplayWidget.tsx`: Компонент для отображения персонажей на сцене.
    -   `ChoiceListWidget.tsx`: Компонент для отображения вариантов выбора.

-   **`/quest`**: Виджеты для системы квестов и заданий.
    -   `QuestJournal.tsx`: Компонент для отображения журнала квестов.

-   **`/inventory`**: Виджеты для инвентаря и экипировки.
    -   `ItemGridWidget.tsx`: Компонент для отображения сетки предметов.
    -   `EquipmentPanelWidget.tsx`: Компонент для отображения экипировки персонажа.

-   **`/map`**: Виджеты для карты и AR-режима.
    -   `QuestMapWidget.tsx`: Основной компонент карты.
    -   `QRScannerWidget.tsx`: Компонент для сканирования QR-кодов.

## Принципы

-   **Композиция**: Виджеты компонуются из более мелких UI-компонентов из shared/ui.
-   **Презентационная логика**: Виджеты содержат только презентационную логику, а бизнес-логика находится в entities и features.
-   **Независимость**: Виджеты не должны зависеть от других виджетов или страниц, только от entities и shared.
-   **Переиспользуемость**: Виджеты должны быть достаточно гибкими для использования в разных контекстах.

## Стилизация и Tailwind CSS

Все виджеты используют Tailwind CSS для стилизации. Это обеспечивает:

1. **Консистентность дизайна**: Использование предопределенных классов обеспечивает единообразие интерфейса.
2. **Ускорение разработки**: Готовые атомарные классы позволяют быстро создавать компоненты.
3. **Адаптивность**: Встроенные медиа-запросы упрощают создание адаптивных интерфейсов.

### Принципы стилизации:

1. **Использование переменных темы**: Все цвета, отступы и другие значения должны браться из CSS-переменных в `shared/ui/theme.css`
   ```html
   <!-- ✅ Правильно -->
   <div className="bg-surface text-text-primary"></div>
   
   <!-- ❌ Неправильно -->
   <div className="bg-gray-800 text-white"></div>
   ```

2. **Композиция классов**: Для часто повторяющихся комбинаций используйте `clsx` или шаблонные строки
   ```jsx
   const baseButtonClass = "px-4 py-2 rounded-lg font-medium";
   const primaryClass = "bg-primary text-on-primary";
   
   <button className={`${baseButtonClass} ${primaryClass}`}>Кнопка</button>
   ```

3. **Использование общих компонентов**: Для стандартных элементов интерфейса используйте компоненты из `shared/ui`
   ```jsx
   // ✅ Правильно
   import { Button } from '@/shared/ui';
   
   <Button variant="primary">Кнопка</Button>
   
   // ❌ Неправильно
   <button className="px-4 py-2 bg-primary text-white rounded-lg">Кнопка</button>
   ```

4. **Адаптивный дизайн**: Используйте префиксы брейкпоинтов `@sm:`, `@md:`, `@lg:` и т.д.
   ```jsx
   <div className="flex flex-col @md:flex-row gap-4">...</div>
   ```

5. **Состояния элементов**: Используйте варианты состояний как `hover:`, `focus:`, `active:` и др.
   ```jsx
   <button className="bg-accent hover:bg-accent-dark focus:ring-2">...</button>
   ```

## Взаимодействие с другими слоями FSD

-   **`pages`**: Страницы импортируют и компонуют виджеты для формирования полноценных экранов приложения.
-   **`features`**: Виджеты, как правило, не должны напрямую зависеть от `features`.
-   **`entities`**: Виджеты могут импортировать и отображать данные из `entities`.
-   **`shared/ui`**: Виджеты активно используют базовые UI-компоненты из этого слоя.

## План рефакторинга и стандартизации Tailwind CSS

### 1. Структурные изменения
- ✅ Объединение дублирующихся компонентов (`CharacterSheet`, `QuestJournal`)
- ☐ Стандартизация структуры папок (ui, model, index)
- ☐ Единообразное именование файлов и компонентов
- ☐ Создание типовых интерфейсов для пропсов виджетов

### 2. Стандартизация Tailwind CSS
- ☐ Создание общего набора утилитарных классов для типовых элементов
  ```jsx
  // Базовые классы для карточек
  const cardBaseClasses = "bg-surface rounded-lg shadow-md p-4";
  // Базовые классы для заголовков
  const headingBaseClasses = "font-heading text-text-primary";
  ```

- ☐ Внедрение единой цветовой палитры через CSS переменные
  ```css
  --primary: #5b21b6;
  --accent: #06b6d4;
  --surface: #1f2937;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  ```

- ☐ Создание набора компонентов-композиций для повторяющихся паттернов
  ```jsx
  const CardHeader = ({ title, subtitle }) => (
    <div className="mb-4">
      <h3 className="text-lg font-medium text-text-primary">{title}</h3>
      {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
    </div>
  );
  ```

### 3. Улучшение доступности и семантики
- ☐ Добавление ARIA-атрибутов к интерактивным элементам
- ☐ Обеспечение правильного контраста для цветовых комбинаций
- ☐ Поддержка темной и светлой темы через data-theme атрибут
- ☐ Добавление поддержки prefers-reduced-motion для анимаций

### 4. Повышение производительности
- ☐ Оптимизация рендеринга с использованием React.memo и useMemo
- ☐ Использование виртуализации для длинных списков (react-window)
- ☐ Ленивая загрузка виджетов через React.lazy

### 5. Улучшение разработки
- ☐ Создание историй Storybook для каждого виджета
- ☐ Внедрение тестов для виджетов (Unit и Component)
- ☐ Улучшение документации компонентов через JSDoc

## Примеры хороших практик

### Использование композиционных классов

```jsx
// До рефакторинга
<button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
  Кнопка
</button>

// После рефакторинга
const buttonClasses = {
  base: "font-bold py-2 px-4 rounded",
  primary: "bg-accent hover:bg-accent-dark text-on-accent",
  secondary: "bg-surface-variant hover:bg-surface-variant-dark text-text-primary"
};

<button className={`${buttonClasses.base} ${buttonClasses.primary}`}>
  Кнопка
</button>
```

### Адаптивный дизайн

```jsx
// До рефакторинга
<div className="flex-col md:flex-row flex gap-4">
  <div className="w-full md:w-1/3">Sidebar</div>
  <div className="w-full md:w-2/3">Content</div>
</div>

// После рефакторинга
<div className="flex flex-col @md:flex-row gap-4">
  <div className="w-full @md:w-1/3">Sidebar</div>
  <div className="w-full @md:w-2/3">Content</div>
</div>
```

### Темизация

```jsx
// До рефакторинга
<div className="bg-gray-900 text-white dark:bg-white dark:text-gray-900">
  Контент
</div>

// После рефакторинга
<div className="bg-surface text-text-primary">
  Контент
</div>
```

## Графики внедрения

### Фаза 1 (Текущая)
- ✅ Объединение дублирующихся компонентов
- ✅ Стандартизация экспортов
- ☐ Обновление README.md с руководством по стилям

### Фаза 2 (Следующий спринт)
- ☐ Рефакторинг компонентов battle и inventory 
- ☐ Внедрение единого набора утилитарных классов
- ☐ Создание историй Storybook для основных виджетов

### Фаза 3 (Будущие улучшения)
- ☐ Рефакторинг оставшихся компонентов
- ☐ Улучшение доступности и семантики
- ☐ Внедрение тестов

## 6. Директивы Tailwind CSS для улучшения виджетов

На основе современных возможностей Tailwind CSS v4 и выше, мы можем значительно улучшить систему стилизации в наших виджетах. Вот ключевые инструменты, которые следует использовать:

### 6.1. Настройка темы через CSS-переменные

Вместо использования JavaScript-конфигурации в tailwind.config.js, мы должны перейти на использование директивы `@theme` в CSS:

```css
/* src/shared/ui/theme.css */
@theme {
  /* Основные цвета фракций */
  --color-faction-neutral: oklch(0.74 0.05 100);
  --color-faction-scavengers: oklch(0.71 0.17 50.24);
  --color-faction-military: oklch(0.65 0.12 140.33);
  --color-faction-scientists: oklch(0.68 0.15 230.88);
  --color-faction-nomads: oklch(0.72 0.18 350.09);
  
  /* Настройка анимаций */
  --animate-scanning: scanning 2s linear infinite;
  --animate-pulse-glow: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  /* Расширение брейкпоинтов */
  --breakpoint-3xl: 120rem;
}
```

### 6.2. Пользовательские утилиты с помощью @utility

Для часто используемых стилей в виджетах мы должны создать пользовательские утилиты:

```css
/* src/shared/ui/tailwind.css */
@utility content-auto {
  content-visibility: auto;
}

@utility scrollbar-hidden {
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@utility text-glitch {
  position: relative;
  
  &::before, &::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  &::before {
    left: 2px;
    text-shadow: -1px 0 var(--color-accent);
    clip: rect(44px, 450px, 56px, 0);
    animation: glitch 5s linear alternate-reverse infinite;
  }
  
  &::after {
    left: -2px;
    text-shadow: 1px 0 var(--color-primary);
    clip: rect(44px, 450px, 56px, 0);
    animation: glitch 5s linear alternate-reverse infinite;
    animation-delay: 0.3s;
  }
}
```

### 6.3. Пользовательские варианты состояний

Мы также можем создать пользовательские варианты состояний, специфичные для нашей игры:

```css
/* src/shared/ui/tailwind.css */
@custom-variant theme-midnight (&:where([data-theme="midnight"] *));
@custom-variant theme-neon (&:where([data-theme="neon"] *));
@custom-variant faction-military (&:where([data-faction="military"] *));
@custom-variant faction-scavengers (&:where([data-faction="scavengers"] *));
@custom-variant damaged (&:where([data-damaged="true"] *));
@custom-variant energy-low (&:where([data-energy="low"] *));
```

### 6.4. Компонентные классы через @layer

Для часто повторяющихся паттернов создадим компонентные классы:

```css
/* src/shared/ui/tailwind.css */
@layer components {
  .card-game {
    background-color: var(--color-bg-card);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-md);
    box-shadow: var(--shadow-lg);
    border: var(--border-width-thin) solid var(--border-color);
    
    @variant hover {
      @media (hover: hover) {
        box-shadow: var(--shadow-xl);
        transform: translateY(-2px);
      }
    }
    
    @variant theme-midnight {
      background-color: var(--color-bg-tertiary);
      box-shadow: var(--neon-blue);
    }
  }
  
  .dialog-container {
    position: relative;
    max-width: 90%;
    margin: 0 auto;
    overflow: hidden;
    
    .dialog-text {
      overflow: hidden;
      white-space: pre-wrap;
      animation: typing 0.05s steps(1);
    }
    
    .dialog-choices {
      margin-top: var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
  }
}
```

### 6.5. Улучшение семантики и доступности

Правильное использование CSS-переменных для обеспечения доступного контраста:

```css
/* src/shared/ui/tailwind.css */
@layer base {
  :root {
    color-scheme: dark;
  }
  
  [data-theme="light"] {
    color-scheme: light;
  }
  
  /* Использование prefers-reduced-motion для пользователей с ограниченными возможностями */
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  
  /* Улучшение фокусных состояний для клавиатурной навигации */
  :focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
  }
}
```

### 6.6. Примеры использования в виджетах

Обновленные примеры использования этих директив в наших виджетах:

```jsx
// VisualNovel/DialogueBoxWidget.tsx
const DialogueBoxWidget = ({ character, text, choices }) => {
  // Определяем фракцию персонажа для стилизации
  const factionClass = character?.faction ? `faction-${character.faction}` : '';
  
  return (
    <div className="dialog-container">
      {character && (
        <div className={`dialog-name ${factionClass}`}>
          {character.name}
        </div>
      )}
      <div 
        className="dialog-text scrollbar-hidden" 
        data-text={text}
      >
        {text}
      </div>
      {choices?.length > 0 && (
        <div className="dialog-choices">
          {choices.map((choice) => (
            <button 
              key={choice.id}
              className="card-game theme-midnight:neon-text-primary"
            >
              {choice.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

Этот подход к рефакторингу виджетов с использованием современных директив Tailwind CSS позволит нам создать более поддерживаемую, консистентную и гибкую систему стилей, которая будет лучше адаптироваться к различным темам и состояниям интерфейса нашей игры.

## 7. Интеграция с Convex

Стандартизация работы с бэкендом Convex в виджетах имеет критическое значение для поддержания единообразного подхода к работе с данными. Ниже описаны паттерны и подходы для корректной интеграции бэкенда Convex в компоненты слоя Widgets.

### 7.1. Организация хуков для работы с Convex

Для организации работы с Convex в виджетах создадим стандартную структуру хуков:

```jsx
// widgets/quest/api/useQuestData.ts
import { useQuery } from "convex/react";
import { api } from "../../../shared/utils/convex";
import { Id } from "../../../convex/_generated/dataModel";

export function useQuestData(questId: Id<"quest">) {
  // Используем useQuery из convex/react для загрузки данных
  const quest = useQuery(api.quest.getQuestById, { id: questId });
  
  // Предоставляем данные виджету с обработкой состояний загрузки/ошибок
  return {
    quest,
    isLoading: quest === undefined,
    error: quest === null ? new Error("Квест не найден") : null
  };
}
```

### 7.2. Инкапсуляция логики бэкенда

Вся логика взаимодействия с бэкендом Convex должна быть инкапсулирована в хуках API виджета или переиспользовать хуки из слоя Features:

```jsx
// widgets/inventory/api/useInventoryActions.ts
import { useMutation } from "convex/react";
import { api } from "../../../shared/utils/convex";
import { Id } from "../../../convex/_generated/dataModel";

export function useInventoryActions() {
  const equipItem = useMutation(api.inventory.equipItem);
  const dropItem = useMutation(api.inventory.dropItem);
  const useItem = useMutation(api.inventory.useItem);

  return {
    equipItem: (itemId: Id<"items">, slotId: string) => 
      equipItem({ itemId, slotId }),
    
    dropItem: (itemId: Id<"items">, quantity?: number) => 
      dropItem({ itemId, quantity: quantity || 1 }),
    
    useItem: (itemId: Id<"items">) => 
      useItem({ itemId })
  };
}
```

### 7.3. Использование в компонентах виджетов

Компоненты виджетов должны использовать хуки для работы с Convex, не взаимодействуя с API напрямую:

```jsx
// widgets/inventory/ui/ItemGridWidget.tsx
import { useInventoryActions } from "../api/useInventoryActions";
import { usePlayerInventory } from "../../../features/player/api/usePlayerInventory";

export const ItemGridWidget = () => {
  // Используем хук из features для получения данных
  const { items, isLoading } = usePlayerInventory();
  
  // Используем хук из виджета для действий
  const { equipItem, useItem, dropItem } = useInventoryActions();
  
  if (isLoading) {
    return <div className="loading-spinner"></div>;
  }
  
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map(item => (
        <div 
          key={item._id}
          className="card-game"
          onClick={() => equipItem(item._id, "main")}
          onContextMenu={(e) => {
            e.preventDefault();
            dropItem(item._id);
          }}
        >
          <img src={item.icon} alt={item.name} />
          <span>{item.name}</span>
        </div>
      ))}
    </div>
  );
};
```

### 7.4. Обработка состояний и ошибок

Стандартизированный подход к обработке состояний загрузки и ошибок в виджетах:

```jsx
// widgets/shared/ui/DataContainer.tsx
import React from 'react';

interface DataContainerProps<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  renderContent: (data: T) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: Error) => React.ReactNode;
}

export function DataContainer<T>({
  data,
  isLoading,
  error,
  renderContent,
  renderLoading = () => <div className="loading-spinner"></div>,
  renderError = (err) => <div className="error-message">{err.message}</div>
}: DataContainerProps<T>) {
  if (isLoading) {
    return renderLoading();
  }
  
  if (error) {
    return renderError(error);
  }
  
  if (data === undefined) {
    return renderError(new Error("Данные не были получены"));
  }
  
  return <>{renderContent(data)}</>;
}
```

### 7.5. Оптимизация производительности запросов

Для оптимизации производительности следует использовать следующие приемы:

1. **Паджинация для списков:**

```jsx
// widgets/quest/api/useQuestsList.ts
import { usePaginatedQuery } from "convex/react";
import { api } from "../../../shared/utils/convex";

export function useQuestsList() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.quest.listQuests,
    {},
    { initialNumItems: 10 }
  );
  
  return {
    quests: results,
    isLoading: status === "loading",
    hasMore: status === "has-more",
    loadMore
  };
}
```

2. **Использование реактивных подписок:**

```jsx
// widgets/battle/api/useBattleState.ts
import { useQuery } from "convex/react";
import { api } from "../../../shared/utils/convex";
import { Id } from "../../../convex/_generated/dataModel";

export function useBattleState(battleId: Id<"battles">) {
  // Реактивно обновляемые данные через Convex
  const battleState = useQuery(api.battle.getBattleState, { battleId });
  const playerState = useQuery(api.battle.getPlayerBattleState, { battleId });
  
  return {
    battleState,
    playerState,
    isLoading: battleState === undefined || playerState === undefined,
    isActive: battleState?.status === "active"
  };
}
```

### 7.6. Типизация данных Convex

Строгая типизация данных, полученных из Convex, с использованием типов из сгенерированных файлов:

```tsx
// widgets/scene/types.ts
import { Id } from "../../../convex/_generated/dataModel";
import { Doc } from "../../../convex/_generated/dataModel";

export type SceneData = Doc<"scenes"> & {
  characters: Array<{
    npcId: Id<"npcs">;
    position: "left" | "center" | "right";
    expression: string;
  }>;
  dialogues: Array<{
    text: string;
    characterId?: Id<"npcs">;
    choices?: Array<{
      text: string;
      nextSceneId?: Id<"scenes">;
      action?: string;
    }>;
  }>;
};

// Использование типов в хуках
export function useScene(sceneId: Id<"scenes">) {
  const scene = useQuery(api.scene.getSceneById, { id: sceneId }) as SceneData | undefined;
  
  // ...
}
```

### 7.7. Мерж локальных данных с серверными

При необходимости мержа локальных данных с серверными используем следующий паттерн:

```jsx
// widgets/map/api/useMapMarkers.ts
import { useQuery } from "convex/react";
import { api } from "../../../shared/utils/convex";
import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";

export function useMapMarkers() {
  // Серверные данные из Convex
  const serverMarkers = useQuery(api.markers.listVisibleMarkers);
  
  // Локальные данные из localStorage
  const [localMarkers, setLocalMarkers] = useLocalStorage("map-markers", []);
  
  // Мерж данных
  const allMarkers = React.useMemo(() => {
    if (!serverMarkers) return localMarkers;
    
    const mergedMarkers = [...serverMarkers];
    
    // Добавляем локальные маркеры, которых нет на сервере
    localMarkers.forEach(localMarker => {
      if (!mergedMarkers.some(m => m.id === localMarker.id)) {
        mergedMarkers.push(localMarker);
      }
    });
    
    return mergedMarkers;
  }, [serverMarkers, localMarkers]);
  
  return {
    markers: allMarkers,
    isLoading: serverMarkers === undefined,
    addLocalMarker: (marker) => {
      setLocalMarkers([...localMarkers, marker]);
    }
  };
}
```

Следуя этим паттернам интеграции Convex с виджетами, мы обеспечим единообразный подход к работе с данными, улучшим поддерживаемость кода и уменьшим количество ошибок при взаимодействии с бэкендом.

## 8. План рефакторинга виджетов с интеграцией Effector

На основе анализа существующей структуры виджетов в `src/widgets` и учета подходов, описанных в README других директорий проекта, необходимо провести следующий рефакторинг:

### 8.1. Стандартизация структуры директорий виджетов

Каждый виджет должен следовать единой структуре:

```
widgets/[ИмяВиджета]/
├── ui/                     # Компоненты пользовательского интерфейса
│   ├── [ИмяВиджетаWidget].tsx  # Основной компонент виджета
│   └── [...].tsx           # Вспомогательные компоненты
├── api/                    # API и хуки для взаимодействия с Effector и Convex
│   ├── use[ИмяВиджета].ts   # Основной хук для работы с данными
│   └── [...].ts            # Вспомогательные хуки
├── model/                  # Модели Effector (при необходимости)
│   ├── stores.ts           # Локальные сторы виджета
│   ├── events.ts           # События
│   └── effects.ts          # Эффекты
├── lib/                    # Вспомогательные функции
├── types.ts                # Типы и интерфейсы
└── index.ts                # Точка входа
```

### 8.2. Рефакторинг использования Effector с React

Использовать современный подход к интеграции Effector с React:

```tsx
// Пример рефакторинга widgets/VisualNovel/ui/DialogueBoxWidget.tsx
import { useUnit } from 'effector-react';
import { 
  $currentDialogue, 
  $dialogChoices, 
  choiceSelected 
} from '../model/stores';

export const DialogueBoxWidget = () => {
  // Используем useUnit вместо deprecated хуков useStore и useEvent
  const [dialogue, choices, onChoiceSelected] = useUnit([
    $currentDialogue, 
    $dialogChoices, 
    choiceSelected
  ]);
  
  return (
    <div className="dialog-container">
      <div className="dialog-text scrollbar-hidden">
        {dialogue.text}
      </div>
      {choices.length > 0 && (
        <div className="dialog-choices">
          {choices.map((choice) => (
            <button
              key={choice.id}
              className="card-game theme-midnight:neon-text-primary"
              onClick={() => onChoiceSelected(choice.id)}
            >
              {choice.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 8.3. Интеграция с Effector-сторами из entities

Правильный подход к использованию сторов из слоя entities:

```tsx
// Пример рефакторинга widgets/battle/api/useBattleState.ts
import { useUnit } from 'effector-react';
import { 
  $battleState, 
  $battleActions,
  actionSelected 
} from '@/entities/battle';

export function useBattleState() {
  const [battleState, actions, selectAction] = useUnit([
    $battleState, 
    $battleActions,
    actionSelected
  ]);
  
  // Дополнительная презентационная логика виджета, не затрагивающая бизнес-логику
  const uiActions = actions.map(action => ({
    ...action,
    isDisabled: action.manaCost > battleState.currentMana,
    className: action.type === 'attack' 
      ? 'action-card action-attack' 
      : 'action-card action-defend'
  }));
  
  return {
    battleState,
    actions: uiActions,
    selectAction
  };
}
```

### 8.4. Рефакторинг взаимодействия с Convex

Стандартизировать взаимодействия с Convex через Effector-эффекты:

```tsx
// Пример рефакторинга widgets/inventory/model/effects.ts
import { createEffect } from 'effector';
import { api } from '@/shared/utils/convex';
import { Id } from '@/convex/_generated/dataModel';

// Эффект для загрузки инвентаря
export const loadInventoryFx = createEffect(async (playerId: Id<'player'>) => {
  return await window.convex.query(api.inventory.getPlayerInventory, { playerId });
});

// Эффект для экипировки предмета
export const equipItemFx = createEffect(async ({ 
  itemId, 
  slotId 
}: { 
  itemId: Id<'items'>, 
  slotId: string 
}) => {
  return await window.convex.mutation(api.inventory.equipItem, { 
    itemId, 
    slotId 
  });
});
```

И их использование в хуках:

```tsx
// Пример рефакторинга widgets/inventory/api/useInventory.ts
import { useUnit } from 'effector-react';
import { 
  $inventory, 
  $equippedItems, 
  loadInventoryFx, 
  equipItemFx 
} from '../model/stores';
import { useAuth } from '@/entities/user';

export function useInventory() {
  const [inventory, equippedItems, pending, equipItem] = useUnit([
    $inventory,
    $equippedItems,
    loadInventoryFx.pending,
    equipItemFx,
  ]);
  
  const { user } = useAuth();
  
  // При монтировании компонента загружаем инвентарь
  React.useEffect(() => {
    if (user?.id) {
      loadInventoryFx(user.id);
    }
  }, [user?.id]);
  
  return {
    items: inventory,
    equippedItems,
    isLoading: pending,
    equipItem
  };
}
```

### 8.5. Задачи рефакторинга по виджетам

1. **battle/**:
   - ✅ Стандартизация API-хуков с useUnit
   - ☐ Оптимизация компонентов с React.memo
   - ☐ Обновление стилей с директивами Tailwind CSS v4

2. **character/**:
   - ✅ Перенос дублирующейся логики в entities/character
   - ✅ Рефакторинг с использованием useUnit
   - ☐ Улучшение преставления атрибутов персонажа

3. **inventory/**:
   - ☐ Разделение логики на api, ui и model
   - ☐ Создание единого интерфейса для ItemGridWidget
   - ☐ Интеграция с Convex через Effector-эффекты

4. **map/**:
   - ☐ Оптимизация рендеринга маркеров на карте
   - ☐ Рефакторинг QRScannerWidget с учетом мобильной поддержки
   - ☐ Улучшение интеграции с геолокацией

5. **quest/** и **QuestJournal/**:
   - ☐ Объединение квестовых виджетов в одну директорию
   - ☐ Создание единой модели представления квестов
   - ☐ Интеграция с агентом AI для генерации подсказок

6. **VisualNovel/**:
   - ☐ Реализация анимаций текста с использованием CSS-переменных
   - ☐ Оптимизация рендеринга персонажей на сцене
   - ☐ Внедрение поддержки аудиоэффектов

7. **Новые виджеты**:
   - ☐ `DataContainer` - универсальный контейнер для обработки состояний загрузки/ошибок
   - ☐ `ActionCard` - стандартизированная карточка действия для боевой системы
   - ☐ `FactionBadge` - компонент для отображения принадлежности к фракции

### 8.6. Приоритеты рефакторинга

**Приоритет 1** (текущий спринт):
1. Стандартизация структуры директорий всех виджетов
2. Рефакторинг хуков с использованием useUnit
3. Улучшение интеграции с Effector

**Приоритет 2** (следующий спринт):
1. Полное внедрение директив Tailwind CSS v4
2. Объединение дублирующейся логики
3. Разработка новых компонентов

**Приоритет 3** (долгосрочные улучшения):
1. Оптимизация производительности
2. Внедрение тестов
3. Документация компонентов

Этот план рефакторинга позволит улучшить качество кода, упростить поддержку и расширение функциональности, а также повысить производительность и пользовательский опыт.