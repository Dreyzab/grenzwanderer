# Grenzwanderer

Постапокалиптическая location-based RPG с элементами визуальной новеллы, карточных боёв и исследования реального мира через QR-коды.

## 🚀 Быстрый старт

### Предварительные требования

- Node.js >= 20.x.x
- npm >= 10.x.x
- Git >= 2.34.x

### Установка

1. **Клонировать репозиторий**
   ```bash
   git clone https://github.com/username/grenzwanderer.git
   cd grenzwanderer/client
   ```

2. **Установить зависимости**
   ```bash
   npm install
   ```

3. **Настроить переменные окружения**

   Скопируйте файл `.env.example` в `.env.local` и заполните необходимые токены:

   ```bash
   cp env.example .env.local
   ```

   Необходимые переменные:
   - `VITE_CONVEX_URL` - URL Convex backend
   - `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key для аутентификации
   - `VITE_MAPBOX_TOKEN` - токен Mapbox для карт

4. **Запуск разработки**

   ```bash
   npm run dev
   ```

   Приложение будет доступно по адресу `http://localhost:3000`

### Production сборка

```bash
npm run build
npm run preview
```

## 🏗️ Архитектура

Проект построен на **Feature-Sliced Design (FSD)** архитектуре с четким разделением слоев:

- **`/app`** - Инициализация приложения и провайдеры
- **`/pages`** - Страницы приложения
- **`/widgets`** - Сложные UI блоки
- **`/features`** - Бизнес-логика
- **`/entities`** - Бизнес-сущности
- **`/shared`** - Общие ресурсы и утилиты

## 🛠️ Технологии

### Frontend
- **React 19** + **TypeScript** - современная SPA платформа
- **Vite** - быстрая сборка и dev server
- **Tailwind CSS** - утилитарная стилизация
- **Framer Motion** - анимации и переходы
- **Zustand** - управление состоянием

### Backend & Services
- **Convex** - real-time база данных
- **Clerk** - аутентификация
- **Mapbox GL** - интерактивные карты

### Development
- **ESLint** + **Prettier** - качество кода
- **Vitest** - тестирование
- **TypeScript** - типизация

## 📱 Progressive Web App

Проект разрабатывается как PWA с поддержкой:
- **Офлайн режим** для core функций
- **Background sync** для синхронизации данных
- **Push уведомления** для игровых событий
- **Geolocation API** для location-based механик
- **Camera API** для QR сканирования

## 🎮 Игровые механики

### Основные системы
- **Visual Novel** - диалоговая система с ветвящимся сюжетом
- **Card Combat** - карточная боевая система
- **Inventory** - grid-based управление предметами
- **Quest System** - сложная система заданий
- **Map System** - интерактивная карта с геолокацией
- **Reputation** - многомерная система репутации

### Location-Based Features
- **QR сканирование** для исследования локаций
- **Path tracking** для записи перемещений
- **Zone discovery** для обнаружения точек интереса
- **POI inspection** для изучения найденных объектов

## 🔄 Development Workflow

### Git Flow
- `main` - стабильная версия
- `develop` - текущая разработка
- `feature/*` - новые функции
- `bugfix/*` - исправления

### Code Style
- **ESLint** с strict правилами
- **Prettier** для форматирования
- **TypeScript** с strict mode
- **Conventional Commits** для коммитов

## 📈 Roadmap

### Фаза 1: Foundation ✅
- ✅ Базовая архитектура FSD
- ✅ Core UI компоненты
- ✅ Convex backend
- ✅ Аутентификация

### Фаза 2: Core Gameplay (В процессе)
- 🏗️ Visual Novel система
- 🏗️ Quest management
- 🏗️ Combat система
- 🏗️ Inventory система

### Фаза 3: Location-Based Features
- 📍 Path tracking system
- 📱 QR scanning
- 🗺️ Zone discovery
- 📍 POI inspection

## 🤝 Contributing

1. Создайте feature branch
2. Внесите изменения
3. Добавьте тесты при необходимости
4. Создайте Pull Request
5. Дождитесь code review

## 📄 Лицензия

Этот проект является частным и предназначен только для личного использования.

---

*Grenzwanderer - постапокалиптическая RPG, сочетающая цифровой и реальный мир.*
