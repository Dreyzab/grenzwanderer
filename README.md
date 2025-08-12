# 🎮 QR-Boost - Постапокалиптическая RPG с визуальной новеллой

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Convex](https://img.shields.io/badge/Convex-FF6B6B?style=for-the-badge&logo=convex&logoColor=white)](https://convex.dev/)
[![Feature-Sliced Design](https://img.shields.io/badge/Feature--Sliced-Design?style=for-the-badge&labelColor=262224&color=F2F2F2&logoWidth=10&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAaCAYAAAC3g3x9AAAACXBIWXMAAALFAAACxQGJ1n/vAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAA/SURBVHgB7dKxCgAgCIThs/d/51JoNQIdDrxvqMXlR4FmFs92KDIX/wI7JSdDN+eHtkxIycnQvMNW8hN/crsDc5QgGX9NvT0AAAAASUVORK5CYII=)](https://feature-sliced.design/)

> **Иммерсивная постапокалиптическая RPG** с системой визуальной новеллы в стиле Disco Elysium, интерактивной картой мира и QR-квестами в реальном мире.

## 🚀 Быстрый старт

### Предварительные требования
- **Node.js** 18+
- **npm** (или yarn)
- **Mapbox токен** (получите на https://mapbox.com)

### Запуск проекта

#### Вариант 1: Автоматический запуск (рекомендуется)

**Linux/macOS:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```cmd
start.bat
```

**Или через npm:**
```bash
cd client
npm install
npm run start
```

#### Вариант 2: Ручной запуск

1. Установите зависимости:
```bash
cd client
npm install
```

2. Создайте файл `.env.local` в папке `client/`:
```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_CONVEX_URL="https://your_convex_deployment.convex.cloud"
CONVEX_DEPLOYMENT=your_deployment_id
VITE_DEV_SEED_TOKEN=dev_secret_token_123
```

> Важно:
> - Не коммитьте реальные токены (Mapbox/Dev seed) в репозиторий. Используйте только `client/.env.local` (он в `.gitignore`).
> - Для разных окружений используйте `client/.env.development` и `client/.env.production` (без секретов).
> - Значения URL в `.env` оборачивайте в кавычки, например: `VITE_CONVEX_URL="https://...convex.cloud"`.
> - Подробности и примеры — в `client/README.md`.

3. Запустите Convex backend:
```bash
npx convex dev --until-success
```

4. В новом терминале запустите Vite dev-сервер:
```bash
npm run dev
```

### После запуска
- 📱 **Фронтенд:** http://localhost:5173
- 📡 **Convex Dashboard:** https://dashboard.convex.dev

## ✨ Основные возможности

### 🎭 Система визуальной новеллы
- **Внутренние голоса персонажа** в стиле Disco Elysium (Логика, Эмпатия, Воля, Восприятие, Внушение)
- **Проверки навыков** с бросками d100
- **Ветвящиеся диалоги** с последствиями и интеграцией квестов
- **Централизованная система диалогов** - единый источник истины в `shared/lib/storage`

### 🗺️ Интерактивная карта мира
- **Mapbox GL JS** интеграция с постапокалиптическими стилями
- **Серверная фильтрация точек** по фазе/флагам/прогрессу (Convex `map_points.listVisible`) — в dev есть клиентский фоллбэк
- **Поэтапное открытие контента** согласно прогрессу квестов

### 🎯 Система квестов
- **Real-time синхронизация** с Convex backend
- **QR-коды** для активации квестов в реальном мире
- **Интеграция с диалогами** и картой
- **FSM (XState)** для ключевых квестов (`delivery_and_dilemma`, `combat_baptism`)
- **Таблица маппинга** `dialogAction → questEvent | outcome` (вместо большого `switch`)
- **Outcomes**: применение последствий (fame/rep/relations/flags/phase/status) через `applyOutcome`
- **NPC‑хабы и Доски**: модальное окно доступных квестов (фильтрация на сервере, сортировка по приоритету)

## 🏗️ Архитектура

Проект построен на основе **Feature-Sliced Design (FSD)** - современной методологии архитектуры фронтенд-приложений.

```
src/
├── 🎯 app/           # Инициализация приложения
├── 📄 pages/         # Страницы-роуты  
├── 🧩 widgets/       # Составные UI-блоки
├── ⚡ features/      # Бизнес-функции
├── 🏢 entities/      # Бизнес-сущности
└── 🔧 shared/        # Переиспользуемый код
```

### Ключевые принципы FSD
- **Четкое разделение ответственности** между слоями
- **Унифицированная система логирования** с типобезопасностью
- **Модульность** для легкого добавления новых фич

### Правила импортов FSD
```typescript
// ✅ Правильно - импорт из публичного API
import { Button, TextField } from '@/shared/ui'
import { useAuth } from '@/entities/user'

// ❌ Неправильно - прямой импорт внутренних модулей
import { Button } from '@/shared/ui/button/Button'
```

## 🔧 Технологический стек

### Frontend
- **React 18** + **TypeScript** - основа приложения
- **Vite** - сборщик и dev-сервер
- **Tailwind CSS** - современная система стилизации
- **React Router** - маршрутизация

### Backend & Data
- **Convex** - backend-as-a-service
- **IndexedDB** - локальное хранилище (offline-first)
- **Mapbox GL JS** - интерактивные карты
 - **XState v5** - конечные автоматы для сценариев квестов

### Development & Quality
- **ESLint** + **Prettier** - качество кода
- **TypeScript** - строгая типизация
- **Feature-Sliced Design** - архитектурная методология

## 📱 Игровые системы

### Visual Novel Engine
```typescript
// Система внутренних голосов
const innerVoices = {
  LOG: 'Логика - холодный расчет',
  EMP: 'Эмпатия - чувства других', 
  VOL: 'Воля - сила духа',
  PER: 'Восприятие - детали окружения',
  SUG: 'Внушение - манипуляции'
}

// Проверки навыков с d100
const skillCheck = {
  skill: 'VOL',
  difficulty: 30,
  modifiers: [{ source: 'tired', value: -5 }]
}
```

### Централизованная система диалогов
```typescript
// Получение диалога из единого источника истины
import { getDialogByKey, getQuestDialogs, dialogExists } from '@/shared/lib/storage'

// Получение конкретного диалога
const dialog = await getDialogByKey('quest_start_dialog')

// Получение всех диалогов квеста
const questDialogs = getQuestDialogs('delivery_and_dilemma_quest')

// Проверка существования диалога
if (dialogExists('trader_meeting_dialog')) {
  // Диалог доступен в системе
}
```

### Современная система стилизации с Tailwind CSS v4
```css
/* CSS переменные вместо @apply директив */
@theme {
  --color-primary: oklch(0.627 0.265 303.9);
  --color-secondary: oklch(0.715 0.143 215.221);
  --spacing-base: 0.25rem;
  --font-display: "Satoshi", sans-serif;
}

/* Использование переменных в компонентах */
.game-ui {
  background: var(--color-primary);
  padding: calc(var(--spacing-base) * 4);
  font-family: var(--font-display);
}
```

### Обновленная система логирования
```typescript
// Гибкое API для различных типов данных
import { logger, LogCategory } from '@/shared/lib/utils'

// Простые данные
logger.info(LogCategory.QUEST, 'Квест завершен', questId)

// Объекты любого типа
logger.info(LogCategory.API, 'Response received', responseData)

// Множественные аргументы
logger.info(LogCategory.DIALOG, 'Dialog choice made', choiceIndex, selectedChoice)
```


## 🔄 **Поток данных и взаимодействия**

### **Архитектура данных:**
``` 
┌─────────────────┐    ┌──────────────────┐
│   Convex DB     │    │   LocalStorage   │
│  (User data)    │    │ (Static data)    │
└─────────┬───────┘    └────────┬─────────┘
          │                     │
          ▼                     ▼
┌─────────────────────────────────────────┐
│           Data Layer                    │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Convex API  │  │ Local Storage   │   │
│  │   Hooks     │  │    Stores       │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          Business Logic                 │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  Entities   │  │    Features     │   │
│  │   (models)  │  │   (use cases)   │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│              UI Layer                   │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Widgets   │  │     Pages       │   │
│  │ (composite) │  │   (routes)      │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘

## 🆕 Что нового

- Квестовая система:
  - XState FSM для `delivery_and_dilemma` и `combat_baptism`
  - `dialogAction → questEvent|outcome` через таблицу маппинга
  - Outcomes с вызовом `applyOutcome` на Convex (fame/rep/relations/flags/phase/status)
- NPC/Доски:
  - Модалка доступных квестов на карте (тип/приоритет из `quest_registry`, кнопки «Обновить», «Принять все (dev)»)
- Серверная фильтрация карты:
  - `map_points.listVisible` учитывает фазу/прогресс/флаги; клиентский `visibility.ts` остаётся только как dev‑фоллбэк

## 🔑 Полезно для dev

- Сид реестра квестов: на странице `/settings` кнопка «Сид реестра квестов (dev)» (нужен `VITE_DEV_SEED_TOKEN` в `client/.env.local`).
- Быстрый старт квестов: модалка на `fjr_board`/`fjr_office_start` позволяет сразу начать квест.