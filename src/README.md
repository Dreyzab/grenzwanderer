# Архитектура приложения "Грэнцвандерер"

Проект построен по методологии **Feature-Sliced Design**, которая обеспечивает разделение кода на независимые слои и сегменты. Это позволяет создать масштабируемую и поддерживаемую кодовую базу.

## Дизайн-система

В основе визуального стиля приложения лежит единая дизайн-система, определенная в `shared/ui`. Она обеспечивает консистентный пользовательский интерфейс во всех компонентах.

### Ключевые элементы дизайн-системы:

- **Тема** - набор CSS-переменных для цветов, отступов, шрифтов и других визуальных аспектов
- **Базовые компоненты** - кнопки, карточки, поля ввода, модальные окна и др.
- **Tailwind CSS** - утилитарные классы для быстрой стилизации
- **Адаптивность** - поддержка различных устройств и размеров экрана

## Структура проекта

```
src/
├── app/          # Глобальные провайдеры, инициализация приложения
├── pages/        # Страницы приложения (роуты)
├── widgets/      # Композиционные блоки интерфейса
├── features/     # Интерактивные пользовательские сценарии 
├── entities/     # Бизнес-сущности
├── shared/       # Общие утилиты, базовые UI-компоненты, константы
├── hooks/        # Пользовательские React-хуки
├── App.tsx       # Корневой компонент
└── main.tsx      # Точка входа
```

## Слои архитектуры

### app

Корневой слой содержит инициализацию приложения, глобальные провайдеры (тема, состояние UI, роутер), конфигурацию и композицию всех остальных слоев.

```tsx
// Пример: Корневой компонент приложения
import { AppProviders } from './providers';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export const App = () => {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
};
```

### pages

Страницы - это композиция виджетов, фич и сущностей, которые отображаются по определенному маршруту.

```tsx
// Пример: Страница игрового процесса
import { PageLayout } from '@/shared/ui';
import { GameScreen } from '@/widgets/gameScreen';
import { CharacterPanel } from '@/widgets/characterDisplay';

export const GamePage = () => {
  return (
    <PageLayout 
      header={<PageHeader title="Игровой мир" />}
      content={
        <div className="flex gap-lg">
          <div className="flex-1">
            <GameScreen />
          </div>
          <div className="w-1/4">
            <CharacterPanel />
          </div>
        </div>
      }
    />
  );
};
```

### widgets

Виджеты - независимые блоки интерфейса, которые объединяют несколько сущностей и элементов.

```tsx
// Пример: Виджет панели навигации
import { Button } from '@/shared/ui';
import { UserBadge } from '@/entities/user';

export const NavBar = () => {
  return (
    <header className="bg-surface p-md flex justify-between items-center">
      <div className="font-heading text-2xl text-accent">Грэнцвандерер</div>
      
      <div className="flex gap-md">
        <Button variant="text" size="sm">Карта</Button>
        <Button variant="text" size="sm">Инвентарь</Button>
        <UserBadge />
      </div>
    </header>
  );
};
```

### features

Features содержат интерактивные компоненты, реализующие пользовательские сценарии.

```tsx
// Пример: Фича сканера QR-кодов
import { Button, Card } from '@/shared/ui';
import { useScanner } from '../model/useScanner';

export const QRScanner = () => {
  const { isScanning, startScan, stopScan, result } = useScanner();
  
  return (
    <Card variant="outlined" padding="lg">
      <div className="flex flex-col gap-md">
        <h3 className="text-xl font-heading">Сканер QR-кодов</h3>
        
        {isScanning ? (
          <Button onClick={stopScan}>Остановить сканирование</Button>
        ) : (
          <Button onClick={startScan}>Начать сканирование</Button>
        )}
        
        {result && (
          <div className="bg-success/10 p-md rounded-lg">
            Результат: {result}
          </div>
        )}
      </div>
    </Card>
  );
};
```

### entities

Entities содержат бизнес-сущности проекта - модели, данные и связанные с ними компоненты.

```tsx
// Пример: Сущность игрока
import { Card } from '@/shared/ui';

export const PlayerCard = ({ player }) => {
  return (
    <Card variant="default" padding="md">
      <h3 className="text-text-primary text-xl font-heading">{player.name}</h3>
      <div className="text-text-secondary text-sm">
        Уровень: {player.level}
      </div>
    </Card>
  );
};
```

### shared

Shared содержит общие утилиты, константы, типы и базовые UI-компоненты. Этот слой не имеет зависимостей от других слоев.

```tsx
// Пример: Базовый UI-компонент кнопки
export const Button = ({ 
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`} 
      {...props}
    >
      {children}
    </button>
  );
};
```

### hooks

Пользовательские React-хуки для повторного использования логики.

```tsx
// Пример: Хук для работы с локальным хранилищем
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  
  return [value, setValue] as const;
}
```

## Правила взаимодействия между слоями

1. Слои могут зависеть только от нижележащих слоев:
   - **app** может импортировать из **pages**, **widgets**, **features**, **entities**, **shared**
   - **pages** может импортировать из **widgets**, **features**, **entities**, **shared**
   - **widgets** может импортировать из **features**, **entities**, **shared**
   - **features** может импортировать из **entities**, **shared**
   - **entities** может импортировать из **shared**
   - **shared** не может импортировать из других слоев

2. Горизонтальные (одноуровневые) импорты между сегментами запрещены, кроме публичного API:
   - ❌ `import { userModel } from "@entities/user/model"`
   - ✅ `import { User } from "@entities/user"`

## Технический стек

- **React** - библиотека для построения пользовательских интерфейсов
- **TypeScript** - типизированный JavaScript
- **Vite** - современный инструмент сборки
- **React Router** - маршрутизация
- **Tailwind CSS** - утилитарный CSS-фреймворк
- **Convex** - бэкенд-как-сервис для работы с данными 