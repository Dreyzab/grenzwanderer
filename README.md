# Grenzwanderer - Рефакторинг

## О проекте

Grenzwanderer - игра в жанре визуальная новелла/RPG с элементами квестов по QR-кодам и геолокации. Проект построен с использованием React, Effector для управления состоянием и Convex в качестве бэкенда.

## Структура проекта

Проект организован по архитектуре Feature-Sliced Design (FSD):

- **app/** - Инициализация приложения, настройка провайдеров
- **entities/** - Бизнес-сущности (персонажи, игроки, предметы, др.)
- **features/** - Пользовательские истории (квесты, сканирование QR-кодов, др.)
- **shared/** - Переиспользуемые компоненты, типы, утилиты
- **widgets/** - Составные блоки UI
- **pages/** - Страницы приложения
- **convex/** - Серверная логика (схемы, запросы, мутации)

## План рефакторинга

## Прогресс рефакторинга

### Завершенная работа

#### 1. Стандартизация API для работы с Convex
- ✅ Создание хуков `useConvexQuery` и `useConvexMutation` для унифицированной работы с API
- ✅ Улучшение обработки ошибок и состояний загрузки
- ✅ Добавление поддержки мокирования данных для режима разработки
- ✅ Интеграция с TanStack Query для улучшенного кэширования
- ✅ Добавление типов для TanStack Query

#### 2. Улучшение интеграции с Effector
- ✅ Создание фабрики `createEntityCrudOperations` для стандартизации работы со стором
- ✅ Соблюдение типизации и упрощение создания хранилищ сущностей
- ✅ Добавление поддержки выбора сущностей
- ✅ Интеграция с режимом разработки и мокирования данных

#### 3. Рефакторинг компонентов
- ✅ Рефакторинг виджетов боевой системы:
  - ✅ `BattleHUDWidget` - переход на использование `useConvexQuery` с TanStack Query
  - ✅ `PlayerCardHandWidget` - добавление состояний загрузки и обработки ошибок
- ✅ Создание документации по использованию новых хуков

#### 4. Интеграция с Context7
- ✅ Реализация утилит `resolveLibraryId` и `getLibraryDocs` для работы с Context7
- ✅ Создание хуков `useContext7` и `useLibraryInfo` для использования в компонентах
- ✅ Разработка компонента `LibraryDocumentation` для отображения документации
- ✅ Добавление поддержки кэширования и мокирования документации
- ✅ Создание документации по использованию Context7

### Текущая работа
- 🔄 Рефакторинг оставшихся виджетов боевой системы (OpponentCardHandWidget, BattleResultModalWidget)
- 🔄 Стандартизация API методов для боевой системы в Convex
- 🔄 Интеграция TypeScript типов с Convex API

### Следующие шаги
- ⬜ Рефакторинг виджетов инвентаря (InventoryDisplay)
- ⬜ Рефакторинг виджетов для работы с квестами
- ⬜ Улучшение визуальных компонентов с использованием состояний загрузки
- ⬜ Интеграция Effector-моделей с хуками Convex

### Известные проблемы
- ⚠️ Необходимо настроить генерацию типов API Convex для предотвращения ошибок типизации
- ⚠️ Требуется улучшение обработки сетевых ошибок и повторных попыток запросов
- ⚠️ Ошибка типизации в useConvexQuery при использовании placeholderData с TanStack Query

## Расширенный план рефакторинга

### 1. Стандартизация структуры API запросов Convex

#### 1.1 Организация API-функций
- ⬜ Разделение API по доменам (battle, inventory, quest, player и т.д.)
- ⬜ Стандартизация именования запросов (get*, list*, create*, update*, delete*)
- ⬜ Выделение общих валидаторов аргументов

#### 1.2 Оптимизация запросов
- ⬜ Использование индексов для оптимизации поиска
- ⬜ Реализация пагинации для списков с помощью `usePaginatedQuery`
- ⬜ Оптимизация реактивности: отказ от лишних подписок с параметром `gcTime`

### 2. Интеграция с TanStack Query

#### 2.1 Миграция на новую архитектуру
- ✅ Исследование возможности использования TanStack Query вместо встроенных хуков
- ✅ Создание провайдеров для интеграции с существующим кодом
- ✅ Разработка хелперов для миграции

#### 2.2 Улучшение управления кэшем
- ✅ Разработка стратегии инвалидации кэша
- ✅ Опимизация запросов через `select` и мемоизацию
- ⬜ Внедрение предварительной загрузки данных (prefetching)

### 3. Структурный рефакторинг компонентов

#### 3.1 Стандартизация директорий
- ⬜ Внедрение структуры виджетов (ui/, model/, api/, lib/, types.ts, index.ts)
- ⬜ Создание шаблонов для новых компонентов
- ⬜ Рефакторинг существующих компонентов

#### 3.2 Улучшение отображения состояний
- ✅ Создание компонентов для унифицированного отображения:
  - ✅ Состояний загрузки (скелетоны, анимации)
  - ✅ Ошибок и повторных попыток
  - ⬜ Пустых состояний

### 4. Рефакторинг по доменам

#### 4.1 Боевая система (Приоритет 1)
- ✅ Рефакторинг `BattleHUDWidget` и `PlayerCardHandWidget`
- ⬜ Рефакторинг `OpponentCardHandWidget`
- ⬜ Рефакторинг `BattleResultModalWidget`
- ⬜ Интеграция с новыми API методами

#### 4.2 Инвентарь (Приоритет 2)
- ⬜ Реструктуризация компонентов инвентаря
- ⬜ Разработка хуков доступа к данным инвентаря
- ⬜ Улучшение UX для взаимодействия с предметами

#### 4.3 Квесты и диалоги (Приоритет 3)
- ⬜ Рефакторинг компонентов визуальной новеллы
- ⬜ Оптимизация загрузки сцен и ресурсов
- ⬜ Расширение возможностей диалоговой системы

### 5. Интеграция с DevTools и улучшение разработки

#### 5.1 Инструменты разработчика
- ⬜ Настройка Convex DevTools
- ⬜ Интеграция Effector DevTools
- ⬜ Улучшение логирования и трассировки ошибок

#### 5.2 Тестирование
- ⬜ Настройка тестового окружения
- ✅ Разработка утилит для мокирования данных
- ⬜ Написание базовых тестов для критических компонентов

### 6. Интеграция с Context7 (Завершено)

#### 6.1 Основные утилиты
- ✅ Разработка API для работы с Context7 (`resolveLibraryId`, `getLibraryDocs`)
- ✅ Реализация кэширования для экономии запросов
- ✅ Поддержка заглушек для режима разработки

#### 6.2 Интеграция с React
- ✅ Создание хуков для работы с документацией (`useContext7`, `useLibraryInfo`)
- ✅ Реализация компонента `LibraryDocumentation` для отображения документации
- ✅ Поддержка различных состояний (загрузка, ошибка, успех)

### График рефакторинга

**Фаза 1 (Текущая - 2 недели)**
- Завершение рефакторинга боевой системы
- Настройка генерации типов API Convex
- Создание базовой структуры для нового подхода к API

**Фаза 2 (Следующие 3 недели)**
- Рефакторинг инвентаря и взаимодействия с предметами
- Улучшение отображения состояний
- Внедрение стандартизированной структуры компонентов

**Фаза 3 (Последующие 2-4 недели)**
- Рефакторинг квестов и диалоговой системы
- Оптимизация производительности
- Интеграция инструментов разработчика

**Фаза 4 (Завершающая)**
- Тестирование и исправление ошибок
- Документирование архитектуры и подходов
- Финальные оптимизации производительности

## Использование хуков

### useConvexQuery

```tsx
import { useConvexQuery } from 'shared/hooks';
import { api } from '../convex/_generated/api';

function PlayerProfile({ playerId }) {
  const { data, isLoading, error } = useConvexQuery(
    api.player.getPlayerProfile,
    { playerId },
    { 
      fallbackData: { name: 'Гость', level: 1 },
      onSuccess: (data) => console.log('Загружен профиль', data) 
    }
  );
  
  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  
  return <div>Игрок: {data.name}, Уровень: {data.level}</div>;
}
```

### useConvexMutation

```tsx
import { useConvexMutation } from 'shared/hooks';
import { api } from '../convex/_generated/api';

function UpdateProfile({ playerId }) {
  const { mutate, isLoading, error } = useConvexMutation(
    api.player.updateProfile,
    {
      onSuccess: () => alert('Профиль обновлен'),
      onError: (err) => console.error(err)
    }
  );
  
  function handleSubmit(e) {
    e.preventDefault();
    mutate({ 
      playerId, 
      name: e.target.name.value 
    });
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Сохранение...' : 'Сохранить'}
      </button>
      {error && <div>Ошибка: {error.message}</div>}
    </form>
  );
}
```

### createEntityCrudOperations

```tsx
import { createEntityCrudOperations } from 'shared/hooks/effector';
import { QuestService } from 'shared/services/api.service';

// Создаем типовые операции для управления квестами
const questOperations = createEntityCrudOperations('quest', {}, {
  fetch: () => QuestService.getAllQuests(),
  add: (quest) => QuestService.createQuest(quest),
  remove: (id) => QuestService.deleteQuest(id),
  update: ({id, updates}) => QuestService.updateQuest(id, updates)
});

// Используем созданные сторы и события
export const $quests = questOperations.$entities;
export const $questsLoading = questOperations.$loading;
export const questAdded = questOperations.entityAdded;
export const questRemoved = questOperations.entityRemoved;
export const fetchQuestsFx = questOperations.fetchEntitiesFx;
```

### useContext7

```tsx
import { useContext7 } from 'shared/hooks';

function ConvexDocs() {
  const { 
    library, 
    documentation, 
    isLoading, 
    error 
  } = useContext7({
    packageName: 'convex',
    topic: 'queries',
    maxTokens: 5000
  });
  
  if (isLoading) return <div>Загрузка документации...</div>;
  
  return (
    <div className="docs-container">
      {library && (
        <div className="library-info">
          <h2>{library.name}</h2>
          <p>{library.description}</p>
        </div>
      )}
      
      {documentation && (
        <pre className="documentation-content">
          {documentation.content}
        </pre>
      )}
    </div>
  );
}
```
