# Хуки для работы с Convex и Effector

В данной документации описаны основные хуки для работы с API Convex и библиотекой Effector.

## Хуки Convex

### useConvexQuery

Хук для выполнения запросов к API Convex с поддержкой TanStack Query.

```tsx
import { useConvexQuery } from 'shared/hooks';
import { api } from '../convex/_generated/api';

function PlayerProfile({ playerId }) {
  const { data, isLoading, error } = useConvexQuery(
    api.player.getPlayerProfile,
    { playerId },
    { 
      fallbackData: { name: 'Гость', level: 1 },
      onSuccess: (data) => console.log('Загружен профиль', data),
      // Включение TanStack Query для улучшенного кэширования и состояния
      useTanStack: true,
      // Время кэширования успешных запросов (в мс)
      staleTime: 1000 * 60 * 5, // 5 минут
      // Обновление при фокусе окна
      refetchOnWindowFocus: true
    }
  );
  
  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  
  return <div>Игрок: {data.name}, Уровень: {data.level}</div>;
}
```

#### Параметры

- `queryFunc` - Функция запроса из Convex API
- `args` - Аргументы для запроса
- `options` - Дополнительные опции:
  - `fallbackData` - Данные, которые будут использоваться до загрузки
  - `enabled` - Флаг, указывающий на активность запроса (по умолчанию `true`)
  - `onSuccess` - Функция, вызываемая при успешном запросе
  - `onError` - Функция, вызываемая при ошибке
  - `useTanStack` - Использовать TanStack Query (по умолчанию `false`)
  - `staleTime` - Время кэширования успешных запросов (в мс)
  - `gcTime` - Время хранения данных после размонтирования компонента (в мс)
  - `refetchOnWindowFocus` - Обновлять при фокусе окна (по умолчанию `true`)
  - `refetchOnMount` - Обновлять при монтировании компонента (по умолчанию `true`)

#### Возвращаемые значения

- `data` - Полученные данные (или `fallbackData`, если данные еще не загружены)
- `isLoading` - Флаг, указывающий на процесс загрузки
- `error` - Объект ошибки (или `null`, если ошибки нет)
- `isError` - Флаг, указывающий на наличие ошибки
- `isSuccess` - Флаг, указывающий на успешное завершение запроса
- `refetch` - Функция для повторного выполнения запроса (доступна только при использовании TanStack Query)

### useConvexMutation

Хук для выполнения мутаций с API Convex с поддержкой TanStack Query.

```tsx
import { useConvexMutation } from 'shared/hooks';
import { api } from '../convex/_generated/api';

function UpdateProfile({ playerId }) {
  const { mutate, isLoading, error } = useConvexMutation(
    api.player.updateProfile,
    {
      onSuccess: () => alert('Профиль обновлен'),
      onError: (err) => console.error(err),
      // Включение TanStack Query
      useTanStack: true,
      // Логировать вызовы мутаций (полезно при разработке)
      logMutation: true
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

#### Параметры

- `mutationFunc` - Функция мутации из Convex API
- `options` - Дополнительные опции:
  - `onSuccess` - Функция, вызываемая при успешной мутации
  - `onError` - Функция, вызываемая при ошибке
  - `onSettled` - Функция, вызываемая при завершении мутации (успешном или с ошибкой)
  - `logMutation` - Логировать вызовы мутаций (по умолчанию `false`)
  - `useTanStack` - Использовать TanStack Query (по умолчанию `false`)
  - `gcTime` - Время хранения результата после размонтирования компонента (в мс)
  - `retry` - Количество повторных попыток при ошибке
  - `retryDelay` - Задержка между повторными попытками (в мс)

#### Возвращаемые значения

- `mutate` - Функция для выполнения мутации
- `mutateAsync` - Функция для выполнения мутации с возвратом промиса (доступна только при использовании TanStack Query)
- `data` - Данные, полученные после выполнения мутации
- `isLoading`/`isPending` - Флаг, указывающий на процесс выполнения мутации
- `error` - Объект ошибки (или `null`, если ошибки нет)
- `isError` - Флаг, указывающий на наличие ошибки
- `isSuccess` - Флаг, указывающий на успешное завершение мутации
- `reset` - Функция для сброса состояния мутации

## Утилиты Effector

### createEntityCrudOperations

Функция для создания типовых CRUD-операций для сущности с использованием Effector.

```tsx
import { createEntityCrudOperations } from 'shared/hooks/effector';
import { QuestService } from 'shared/services/api.service';

// Создаем типовые операции для управления квестами
const questOperations = createEntityCrudOperations('quest', {}, {
  fetch: () => QuestService.getAllQuests(),
  fetchById: (id) => QuestService.getQuestById(id),
  add: (quest) => QuestService.createQuest(quest),
  remove: (id) => QuestService.deleteQuest(id),
  update: ({id, updates}) => QuestService.updateQuest(id, updates)
}, {
  // Данные для режима разработки
  mockData: {
    entities: sampleQuests,
    entityById: sampleQuest
  },
  // Включить расширенное логирование
  debug: true
});

// Используем созданные сторы и события
export const $quests = questOperations.$entities;
export const $questsLoading = questOperations.$loading;
export const $selectedQuestId = questOperations.$selectedId;
export const questAdded = questOperations.entityAdded;
export const questRemoved = questOperations.entityRemoved;
export const selectQuest = questOperations.selectEntity;
export const fetchQuestsFx = questOperations.fetchEntitiesFx;
export const fetchQuestByIdFx = questOperations.fetchEntityByIdFx;
```

#### Параметры

- `name` - Имя сущности для использования в названиях сторов и событий
- `initialState` - Начальное состояние хранилища
- `api` - Объект с функциями API для выполнения CRUD-операций:
  - `fetch` - Функция для получения всех сущностей
  - `fetchById` - Функция для получения сущности по ID
  - `add` - Функция для создания сущности
  - `remove` - Функция для удаления сущности
  - `update` - Функция для обновления сущности
- `options` - Дополнительные опции:
  - `mockData` - Данные для режима разработки:
    - `entities` - Данные для метода `fetch`
    - `entityById` - Данные для метода `fetchById`
  - `debug` - Включить расширенное логирование

#### Возвращаемые значения

- Сторы:
  - `$entities` - Стор с сущностями
  - `$loading` - Стор с состоянием загрузки
  - `$error` - Стор с ошибкой
  - `$selectedId` - Стор с выбранным ID сущности
- События:
  - `entityAdded` - Событие добавления сущности
  - `entityRemoved` - Событие удаления сущности
  - `entityUpdated` - Событие обновления сущности
  - `setEntities` - Событие установки всех сущностей
  - `selectEntity` - Событие выбора сущности
- Эффекты:
  - `fetchEntitiesFx` - Эффект получения всех сущностей
  - `addEntityFx` - Эффект добавления сущности
  - `removeEntityFx` - Эффект удаления сущности
  - `updateEntityFx` - Эффект обновления сущности
  - `fetchEntityByIdFx` - Эффект получения сущности по ID 

## Хуки Context7

### useContext7

Хук для получения документации по библиотекам с использованием Context7.

```tsx
import { useContext7 } from 'shared/hooks';

function ConvexDocumentation() {
  const { 
    library, 
    documentation, 
    isLoading, 
    error, 
    loadDocumentation 
  } = useContext7({
    packageName: 'convex',
    topic: 'queries',
    maxTokens: 5000,
    autoLoad: true
  });
  
  if (isLoading) return <div>Загрузка документации...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  
  return (
    <div>
      <h2>{library?.name}</h2>
      <p>{library?.description}</p>
      
      {documentation && (
        <div className="documentation">
          <pre>{documentation.content}</pre>
          <p>Источник: {documentation.source}</p>
        </div>
      )}
      
      <button onClick={() => loadDocumentation('convex', 'mutations')}>
        Загрузить документацию по мутациям
      </button>
    </div>
  );
}
```

#### Параметры

- `options` - Дополнительные опции:
  - `packageName` - Название библиотеки/пакета для получения документации
  - `topic` - Тема/раздел документации для фокусировки
  - `maxTokens` - Максимальное количество токенов для получения (по умолчанию `10000`)
  - `autoLoad` - Автоматически загружать документацию при изменении параметров (по умолчанию `true`)
  - `useMock` - Использовать заглушки вместо реальных вызовов API (по умолчанию определяется из `VITE_USE_CONTEXT7_MOCK`)

#### Возвращаемые значения

- `status` - Текущее состояние загрузки (`'idle'`, `'resolving'`, `'loading'`, `'success'`, `'error'`)
- `library` - Информация о библиотеке (если найдена)
- `documentation` - Загруженная документация
- `error` - Ошибка (если произошла)
- `isLoading` - Флаг загрузки данных
- `loadDocumentation` - Функция для загрузки документации

### useLibraryInfo

Хук для получения информации о библиотеке без загрузки полной документации.

```tsx
import { useLibraryInfo } from 'shared/hooks';

function LibraryInfoCard({ packageName }) {
  const { library, isLoading, error, resolveLibrary } = useLibraryInfo(packageName);
  
  if (isLoading) return <div>Загрузка информации...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  
  return (
    <div className="library-card">
      {library && (
        <>
          <h2>{library.name}</h2>
          <p>{library.description}</p>
          {library.githubStars && <p>⭐ {library.githubStars} звезд на GitHub</p>}
          {library.codeSnippetCount && <p>📝 {library.codeSnippetCount} примеров кода</p>}
        </>
      )}
      <button onClick={() => resolveLibrary('react')}>
        Загрузить информацию о React
      </button>
    </div>
  );
}
```

#### Параметры

- `packageName` - Имя пакета для получения информации

#### Возвращаемые значения

- `library` - Информация о библиотеке (если найдена)
- `isLoading` - Флаг загрузки данных
- `error` - Ошибка (если произошла)
- `resolveLibrary` - Функция для получения информации о библиотеке 