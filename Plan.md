# Game Design Document (GDD) - Grenzwanderer

## 🎮 Обзор игры

**Grenzwanderer** — это постапокалиптическая location-based RPG, сочетающая в себе элементы визуальной новеллы, карточных боёв и исследования реального мира через QR-коды. Действие происходит в разрушенном Фрайбурге, где игрок должен выживать, выполнять квесты, развивать репутацию и принимать моральные решения, влияющие на сюжет.

## 🏗️ Техническая архитектура

### **Core Technology Stack**

#### Frontend Architecture
- **React 19** + **TypeScript** + **Vite** — современная SPA платформа
- **Framer Motion** — сложная система анимаций и переходов
- **Zustand** — легковесное управление состоянием с persistence
- **Tailwind CSS** — утилитарная система стилизации
- **Feature-Sliced Design (FSD)** — модульная архитектура с четким разделением слоев

#### Backend & Services
- **Convex** — real-time база данных с функциями и аутентификацией
- **Clerk** — система аутентификации и управления пользователями
- **Mapbox GL** — интерактивные карты с геолокацией
- **XState** — машины состояний для сложной игровой логики

#### PWA Technologies & Offline-First
```typescript
// Progressive Web App архитектура
interface PWAConfig {
  // Service Worker стратегии
  caching: {
    gameAssets: 'CacheFirst',     // Статические ассеты игры
    mapData: 'NetworkFirst',      // Карты и локации
    gameState: 'CacheOnly',       // Пользовательский прогресс
    apiData: 'StaleWhileRevalidate' // Квесты и контент
  }
  
  // Офлайн функциональность
  offline: {
    core: ['inventory', 'combat', 'dialogue'], // Работает без сети
    partial: ['map', 'quests'],                // Ограниченно без сети
    online: ['multiplayer', 'leaderboards']   // Требует сеть
  }
  
  // Background Sync
  backgroundSync: {
    questProgress: { retryInterval: 30000 },   // 30 секунд
    locationUpdates: { retryInterval: 60000 }, // 1 минута
    inventoryChanges: { retryInterval: 10000 } // 10 секунд
  }
}

// Offline Storage Strategy
interface OfflineStorage {
  // IndexedDB для больших данных
  indexedDB: {
    gameContent: 'quest_data' | 'dialogue_trees' | 'card_templates',
    userProgress: 'save_states' | 'session_cache' | 'offline_actions',
    mapData: 'location_cache' | 'marker_data' | 'route_history'
  }
  
  // LocalStorage для критических данных
  localStorage: {
    playerProfile: PlayerProfile,
    gameSettings: GameSettings,
    authTokens: AuthData,
    lastSyncTimestamp: number
  }
  
  // SessionStorage для временных данных
  sessionStorage: {
    currentSession: GameSession,
    uiState: UIState,
    tempProgress: TemporaryData
  }
}

// Push Notifications
interface NotificationSystem {
  // Типы уведомлений
  types: {
    questComplete: { title: string, icon: string, vibrate: [200] },
    newLocation: { title: string, icon: string, actions: ['view', 'dismiss'] },
    raidExpired: { title: string, icon: string, urgency: 'high' },
    dailyReward: { title: string, icon: string, badge: number }
  }
  
  // Триггеры
  triggers: {
    geofence: LocationTrigger[],    // Уведомления по геолокации
    timer: TimedTrigger[],          // По времени
    event: EventTrigger[]           // По игровым событиям
  }
}
```

#### Advanced PWA Features
```typescript
// Геолокация с повышенной точностью
interface LocationServices {
  // Высокоточный трекинг
  preciseTracking: {
    enableHighAccuracy: true,
    maximumAge: 10000,          // 10 секунд кеш
    timeout: 15000,             // 15 секунд таймаут
    desiredAccuracy: 5          // 5 метров желаемая точность
  }
  
  // Background Location (с разрешением пользователя)
  backgroundLocation: {
    minDistance: 10,            // Минимальное расстояние для обновления
    interval: 30000,            // 30 секунд между проверками
    fastestInterval: 15000,     // Минимальный интервал
    locationTimeout: 10000      // Таймаут получения координат
  }
  
  // Геофенсинг
  geofencing: {
    zones: GeofenceZone[],      // Зоны для мониторинга
    sensitivity: 'balanced',    // 'high' | 'balanced' | 'low'
    persistentTracking: true    // Отслеживание в фоне
  }
}

// Camera API для QR сканирования
interface CameraFeatures {
  // QR Scanner конфигурация
  qrScanner: {
    preferredCamera: 'environment', // Задняя камера
    scanArea: { width: 0.8, height: 0.6 }, // 80% x 60% экрана
    formats: ['QR_CODE', 'DATA_MATRIX'],
    frameRate: 30,              // 30 FPS
    resolution: 'hd'            // HD качество
  }
  
  // AR возможности (будущее)
  arCapabilities: {
    motionSensors: boolean,     // Акселерометр/гироскоп
    depthSensing: boolean,      // Определение глубины
    lightEstimation: boolean,   // Освещение сцены
    planeDetection: boolean     // Обнаружение поверхностей
  }
}

// Оптимизация производительности
interface PerformanceOptimization {
  // Lazy Loading
  lazyLoading: {
    routes: 'dynamic',          // Динамическая загрузка страниц
    components: 'intersection', // Загрузка при появлении
    images: 'progressive',      // Прогрессивная загрузка
    maps: 'viewport'            // Загрузка видимой области
  }
  
  // Code Splitting
  bundleStrategy: {
    vendor: 'separate',         // Отдельный vendor bundle
    features: 'route-based',    // По маршрутам
    shared: 'common-chunks',    // Общие компоненты
    dynamic: 'on-demand'        // По требованию
  }
  
  // Memory Management
  memoryOptimization: {
    maxCacheSize: '50MB',       // Максимальный кеш
    gcInterval: 300000,         // Сборка мусора каждые 5 минут
    imageCompression: true,     // Сжатие изображений
    dataCleanup: 'session-end'  // Очистка при завершении сессии
  }
}
```

#### Core Libraries
- **Lucide React** — иконочный набор для UI
- **React Router DOM** — клиентская маршрутизация
- **React Error Boundary** — обработка ошибок в компонентах
- **@dnd-kit** — drag & drop функциональность для боевой системы
- **Workbox** — PWA инструментарий для Service Worker
- **IndexedDB** — клиентская база данных для офлайн хранения

## 📦 Полный Technology Stack & Dependencies

### **🚀 Core Framework (Production Dependencies)**
```json
{
  "react": "^19.1.1",                    // ⚛️ UI библиотека
  "react-dom": "^19.1.1",               // ⚛️ DOM рендеринг
  "react-router-dom": "^7.8.0",         // 🛣️ Клиентская маршрутизация
  "react-error-boundary": "^6.0.0"      // 🛡️ Обработка ошибок компонентов
}
```

### **🎨 UI & Styling Libraries**
```json
{
  "framer-motion": "^12.23.22",         // 🎬 Анимации и переходы
  "lucide-react": "^0.544.0",           // 🎯 Иконочный набор
  "@dnd-kit/core": "^6.3.1",            // 🖱️ Drag & Drop основа
  "@dnd-kit/sortable": "^10.0.0"        // 📋 Сортируемые списки
}
```

### **🗄️ Backend & Database**
```json
{
  "convex": "^1.25.4",                  // 💾 Real-time база данных
  "@clerk/clerk-react": "^5.42.1",      // 🔐 Аутентификация
  "svix": "^1.73.0"                     // 📡 Webhooks для уведомлений
}
```

### **🎮 Game Mechanics Libraries**
```json
{
  "zustand": "^5.0.7",                  // 🧠 State management
  "xstate": "^5.20.2",                  // 🤖 State machines для квестов
  "mapbox-gl": "^3.14.0",              // 🗺️ Интерактивные карты
  "fast-deep-equal": "^3.1.3"          // ⚡ Быстрое сравнение объектов
}
```

### **⚙️ Development & Build Tools**
```json
{
  "vite": "^7.1.0",                     // ⚡ Build tool и dev server
  "typescript": "~5.8.3",               // 📝 Типизация
  "@vitejs/plugin-react": "^4.7.0",     // ⚛️ React plugin для Vite
  "concurrently": "^9.0.2"              // 🔄 Параллельный запуск команд
}
```

### **🧪 Testing & Quality**
```json
{
  "vitest": "^2.1.9",                   // 🧪 Unit testing
  "@vitest/coverage-v8": "^2.1.9",      // 📊 Code coverage
  "eslint": "^9.32.0",                  // 🔍 Линтер кода
  "eslint-plugin-boundaries": "^5.0.1", // 🚧 FSD архитектура
  "eslint-plugin-react-hooks": "^5.2.0", // ⚛️ React hooks правила
  "typescript-eslint": "^8.39.0"        // 📝 TypeScript ESLint
}
```

### **🎨 Styling & CSS**
```json
{
  "tailwindcss": "^4.1.11",            // 🎨 Utility-first CSS
  "@tailwindcss/postcss": "^4.1.11"    // 🔧 PostCSS интеграция
}
```

### **📱 PWA & Mobile (Planned for Phase 7)**
```json
{
  // Будут добавлены в Фазе 7
  "vite-plugin-pwa": "^0.20.x",        // 📱 PWA plugin для Vite
  "workbox-window": "^7.0.x",          // 🔄 Service Worker управление
  "@zxing/library": "^0.21.x"          // 📱 QR код сканирование
}
```

### **🌍 Geolocation & Maps (Expanding in Phase 5)**
```json
{
  // Текущее
  "mapbox-gl": "^3.14.0",              // 🗺️ Карты (уже используется)
  
  // Планируется
  "turf": "^7.0.x",                    // 🌍 Геоспациальные вычисления
  "geohash": "^0.2.x",                 // 📍 Геохеширование
  "h3-js": "^4.1.x"                    // 🔷 Hexagonal hierarchical geospatial indexing
}
```

### **🎯 Game-Specific Libraries (Future Phases)**
```json
{
  // Фаза 8: Advanced Features
  "socket.io-client": "^4.7.x",        // 🔗 Real-time multiplayer
  "three": "^0.160.x",                 // 🎮 3D graphics для AR
  "@react-three/fiber": "^8.15.x",     // ⚛️ React + Three.js
  
  // Фаза 6: Enhanced QR
  "@capacitor/camera": "^6.0.x",       // 📷 Native camera access
  "@capacitor/geolocation": "^6.0.x",  // 📍 Native geolocation
  
  // Фаза 7: PWA Advanced
  "idb": "^8.0.x",                     // 💾 IndexedDB wrapper
  "comlink": "^4.4.x"                  // 🔗 Web Worker communication
}
```

## 🛠️ **Development Environment Requirements**

### **System Requirements**
```bash
Node.js: >= 20.x.x
npm: >= 10.x.x
Git: >= 2.34.x
```

### **IDE & Extensions (Recommended)**
```json
{
  "vscode_extensions": [
    "bradlc.vscode-tailwindcss",        // 🎨 Tailwind CSS IntelliSense
    "ms-vscode.vscode-typescript-next", // 📝 TypeScript support
    "dbaeumer.vscode-eslint",           // 🔍 ESLint integration
    "esbenp.prettier-vscode",           // 💅 Code formatting
    "ms-vscode.vscode-json",            // 📄 JSON support
    "formulahendry.auto-rename-tag",    // 🏷️ Auto rename paired tags
    "christian-kohler.path-intellisense" // 📁 Path autocomplete
  ]
}
```

### **Environment Variables (.env.local)**
```bash
# Core Services
VITE_CONVEX_URL=                      # 💾 Convex backend URL
VITE_CLERK_PUBLISHABLE_KEY=           # 🔐 Clerk authentication

# External APIs
VITE_MAPBOX_TOKEN=                    # 🗺️ Mapbox access token

# Development
VITE_DEV_MODE=true                    # 🔧 Development mode
VITE_LOG_LEVEL=debug                  # 📝 Logging level
```

## 📋 **Installation & Setup Commands**

### **Initial Setup**
```bash
# 1. Clone repository
git clone https://github.com/username/grenzwanderer.git
cd grenzwanderer/client

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your tokens

# 4. Start development
npm run start
```

### **Production Build**
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run lint
```

## 🔮 **Future Technology Additions by Phase**

### **Phase 5 (Q4 2025): Location-Based Core**
- `turf` для геоспациальных вычислений
- `geohash` для зонирования
- Enhanced `mapbox-gl` features

### **Phase 6 (Q1 2026): Enhanced QR & Mobile**
- `@zxing/library` для QR сканирования
- `@capacitor/camera` для native camera
- Camera API polyfills

### **Phase 7 (Q2 2026): PWA Excellence**
- `vite-plugin-pwa` для service worker
- `workbox-window` для cache management
- `idb` для offline storage

### **Phase 8 (Q3 2026): Multiplayer & Advanced**
- `socket.io-client` для real-time events
- `three.js` для 3D визуализации
- `@react-three/fiber` для React integration

### **Phase 9-10 (Q4 2026 - Q1 2027): Polish & Launch**
- Analytics libraries
- Performance monitoring tools
- Localization libraries

## 🎯 **Package.json Scripts Reference**

```json
{
  "scripts": {
    "dev": "vite",                     // 🚀 Development server
    "build": "tsc -b && vite build",   // 🏗️ Production build
    "preview": "vite preview",         // 👀 Preview build
    "start": "concurrently ...",       // 🔄 Start all services
    "lint": "eslint .",                // 🔍 Lint code
    "test": "vitest run",              // 🧪 Run tests
    "test:watch": "vitest"             // 👁️ Watch tests
  }
}
```

**Итого:** Проект использует современный стек из **30+ библиотек**, оптимизированный для PWA разработки с геолокационными возможностями.

### **Архитектурные принципы**

#### Hybrid State Architecture
Разделение на **World State** (серверное) и **Player State** (клиентское) состояния:

```typescript
// Серверное состояние (Convex) - World State
interface WorldState {
  globalEvents: WorldEvent[]        // Мировые события, влияющие на всех
  npcStates: NPCState[]            // Состояния NPC и их доступность  
  economyData: MarketPrices        // Цены торговцев, курсы валют
  questRegistry: QuestTemplate[]   // Каталог доступных квестов
  worldFlags: Record<string, any>  // Глобальные флаги прогресса
  activeZones: AnomalyZone[]       // Временные зоны и события
}

// Клиентское состояние (Zustand) - Player State  
interface PlayerState {
  profile: PlayerProfile           // Репутация, уровень, статистика
  inventory: InventorySystem       // Предметы, контейнеры, снаряжение
  questProgress: QuestProgress[]   // Прогресс по квестам
  locationHistory: LocationLog[]   // История перемещений
  uiPreferences: UISettings        // Настройки интерфейса
  sessionData: SessionCache        // Кеш текущей сессии
}
```

#### Feature-Sliced Design (FSD) Архитектура
Полная структура проекта с детальным описанием каждого слоя:

### **📁 App Layer** (Инициализация приложения)
```typescript
/app/
├── providers/              # Провайдеры контекста
│   ├── ConvexProvider.tsx     # Convex клиент и real-time подключение
│   ├── AuthProvider.tsx       # Clerk аутентификация
│   ├── ThemeProvider.tsx      # Темизация и настройки UI
│   └── ErrorBoundary.tsx      # Глобальная обработка ошибок
├── router/                 # Маршрутизация
│   ├── AppRouter.tsx          # Основные маршруты приложения
│   ├── ProtectedRoute.tsx     # Защищенные маршруты
│   └── routeConfig.ts         # Конфигурация маршрутов
├── store/                  # Глобальные сторы
│   ├── appStore.ts            # Состояние приложения
│   └── settingsStore.ts       # Пользовательские настройки
└── App.tsx                 # Корневой компонент
```

### **📁 Pages Layer** (Страницы приложения)
```typescript
/pages/
├── HomePage/               # Главная страница (dashboard)
│   ├── HomePage.tsx           # Основной компонент
│   ├── ui/                    # UI компоненты страницы
│   │   ├── PlayerStatusCard.tsx
│   │   ├── QuickActionsGrid.tsx
│   │   ├── ActiveQuestsList.tsx
│   │   └── SystemStatusCard.tsx
│   └── model/                 # Логика страницы
│       └── useHomeData.ts
├── MapPage/                # Интерактивная карта
│   ├── MapPage.tsx
│   ├── ui/
│   │   ├── MapControls.tsx
│   │   ├── LocationFilters.tsx
│   │   └── PointsListPanel.tsx
│   └── model/
│       └── useMapState.ts
├── QuestPage/              # Управление квестами
│   ├── QuestPage.tsx
│   ├── ui/
│   │   ├── QuestCard.tsx
│   │   ├── QuestFilters.tsx
│   │   └── QuestDetails.tsx
│   └── model/
│       └── useQuestFilters.ts
├── CombatPage/             # Карточные бои
│   ├── CombatPage.tsx
│   ├── ui/
│   │   ├── BattlefieldGrid.tsx
│   │   ├── CardHand.tsx
│   │   ├── EnemyArea.tsx
│   │   └── CombatUI.tsx
│   └── model/
│       └── useCombatSession.ts
├── InventoryPage/          # Управление предметами
│   ├── InventoryPage.tsx
│   ├── ui/
│   │   ├── InventoryGrid.tsx
│   │   ├── ContainerTabs.tsx
│   │   ├── ItemDetails.tsx
│   │   └── SortingControls.tsx
│   └── model/
│       └── useInventoryState.ts
├── VisualNovelPage/        # Диалоговая система
│   ├── VisualNovelPage.tsx
│   ├── ui/
│   │   ├── DialogueBox.tsx
│   │   ├── CharacterSprites.tsx
│   │   ├── ChoiceButtons.tsx
│   │   └── SceneBackground.tsx
│   └── model/
│       └── useDialogueState.ts
├── SettingsPage/           # Настройки игры
│   ├── SettingsPage.tsx
│   ├── ui/
│   │   ├── GameSettings.tsx
│   │   ├── AudioSettings.tsx
│   │   └── DisplaySettings.tsx
│   └── model/
│       └── useSettings.ts
└── QRScannerPage/          # QR сканирование
    ├── QRScannerPage.tsx
    ├── ui/
    │   ├── CameraView.tsx
    │   ├── ScanOverlay.tsx
    │   └── ScanResult.tsx
    └── model/
        └── useQRScanner.ts
```

### **📁 Widgets Layer** (Сложные UI блоки)
```typescript
/widgets/
├── MapWidget/              # Виджет интерактивной карты
│   ├── MapWidget.tsx          # Основной компонент карты
│   ├── ui/
│   │   ├── MapMarkers.tsx     # Отображение маркеров
│   │   ├── MapControls.tsx    # Элементы управления
│   │   ├── LocationTooltip.tsx # Тултипы локаций
│   │   └── GeolocationButton.tsx # Кнопка текущей позиции
│   ├── model/
│   │   ├── useMapState.ts     # Состояние карты
│   │   ├── useMarkers.tsx     # Логика маркеров
│   │   ├── useClientVisiblePoints.ts # Видимые точки
│   │   └── useGeolocation.ts  # Геолокация
│   └── lib/
│       ├── mapboxConfig.ts    # Конфигурация Mapbox
│       └── markerUtils.ts     # Утилиты маркеров
├── NavigationWidget/       # Виджет навигации
│   ├── NavigationWidget.tsx
│   ├── ui/
│   │   ├── TabBar.tsx
│   │   ├── NotificationBadge.tsx
│   │   └── QuickActions.tsx
│   └── model/
│       └── useNavigation.ts
├── StatusWidget/           # Виджет статуса игрока
│   ├── StatusWidget.tsx
│   ├── ui/
│   │   ├── ProgressBars.tsx
│   │   ├── StatCards.tsx
│   │   └── AchievementBadges.tsx
│   └── model/
│       └── usePlayerStatus.ts
└── NotificationWidget/     # Виджет уведомлений
    ├── NotificationWidget.tsx
    ├── ui/
    │   ├── NotificationItem.tsx
    │   ├── NotificationList.tsx
    │   └── ToastNotification.tsx
    └── model/
        └── useNotifications.ts
```

### **📁 Features Layer** (Бизнес-логика)
```typescript
/features/
├── authentication/         # Система аутентификации
│   ├── api/
│   │   └── authApi.ts         # API аутентификации
│   ├── model/
│   │   ├── authStore.ts       # Стор аутентификации
│   │   └── useAuth.ts         # Хук аутентификации
│   └── ui/
│       ├── LoginForm.tsx
│       ├── SignupForm.tsx
│       └── UserProfile.tsx
├── path-tracking/          # Трекинг перемещений игрока
│   ├── api/
│   │   └── trackingApi.ts     # API трекинга
│   ├── model/
│   │   ├── routeStore.ts      # Стор маршрутов
│   │   ├── useRouteRecorder.ts # Запись маршрута
│   │   └── useGeofencing.ts   # Геофенсинг
│   ├── ui/
│   │   ├── TrackingIndicator.tsx
│   │   └── RouteStats.tsx
│   └── lib/
│       ├── geoUtils.ts        # Геоутилиты
│       ├── compression.ts     # Сжатие треков
│       └── validation.ts      # Валидация координат
├── zone-discovery/         # Обнаружение зон и локаций
│   ├── api/
│   │   └── explorationApi.ts  # API исследования
│   ├── model/
│   │   ├── discoveryStore.ts  # Стор открытий
│   │   └── useZoneDiscovery.ts # Хук обнаружения зон
│   ├── ui/
│   │   ├── DiscoveryNotification.tsx
│   │   └── ZoneProgress.tsx
│   └── lib/
│       └── zoneCalculation.ts # Расчеты зон
├── poi-inspection/         # Изучение точек интереса
│   ├── api/
│   │   └── poiApi.ts          # API точек интереса
│   ├── model/
│   │   ├── poiStore.ts        # Стор точек интереса
│   │   └── usePoiInspection.ts # Хук изучения POI
│   ├── ui/
│   │   ├── POIDetails.tsx
│   │   ├── ResearchButton.tsx
│   │   └── POIStatus.tsx
│   └── lib/
│       └── poiUtils.ts        # Утилиты POI
├── phone-points/           # "Телефон" - список точек
│   ├── model/
│   │   ├── phoneStore.ts      # Стор телефона
│   │   └── usePhonePoints.ts  # Хук списка точек
│   ├── ui/
│   │   ├── PointsList.tsx     # Список точек
│   │   ├── PointFilters.tsx   # Фильтры
│   │   ├── PointItem.tsx      # Элемент списка
│   │   └── StatusBadges.tsx   # Бейджи статусов
│   └── lib/
│       └── filterUtils.ts     # Утилиты фильтрации
├── quest-management/       # Управление квестами
│   ├── api/
│   │   └── questApi.ts        # API квестов
│   ├── model/
│   │   ├── questStore.ts      # Стор квестов
│   │   ├── useQuestProgress.ts # Прогресс квестов
│   │   └── useQuestValidation.ts # Валидация квестов
│   ├── ui/
│   │   ├── QuestTracker.tsx
│   │   ├── QuestRewards.tsx
│   │   └── QuestObjectives.tsx
│   └── lib/
│       ├── questUtils.ts      # Утилиты квестов
│       └── progressCalculation.ts # Расчет прогресса
├── combat-system/          # Карточная боевая система
│   ├── api/
│   │   └── combatApi.ts       # API боевой системы
│   ├── model/
│   │   ├── combatStore.ts     # Стор боя
│   │   ├── deckStore.ts       # Стор колоды
│   │   ├── useCombatEngine.ts # Движок боя
│   │   └── useCardValidation.ts # Валидация карт
│   ├── ui/
│   │   ├── CombatField.tsx    # Поле боя
│   │   ├── CardComponent.tsx  # Компонент карты
│   │   ├── DeckBuilder.tsx    # Конструктор колоды
│   │   └── BattleLog.tsx      # Лог битвы
│   └── lib/
│       ├── cardEngine.ts      # Движок карт
│       ├── damageCalculation.ts # Расчет урона
│       └── aiLogic.ts         # ИИ противника
├── inventory-management/   # Управление инвентарем
│   ├── api/
│   │   └── inventoryApi.ts    # API инвентаря
│   ├── model/
│   │   ├── inventoryStore.ts  # Стор инвентаря
│   │   ├── containerStore.ts  # Стор контейнеров
│   │   ├── useInventoryLogic.ts # Логика инвентаря
│   │   └── useDragAndDrop.ts  # Drag & Drop
│   ├── ui/
│   │   ├── InventorySlot.tsx  # Слот инвентаря
│   │   ├── ItemTooltip.tsx    # Тултип предмета
│   │   ├── ContainerView.tsx  # Вид контейнера
│   │   └── SortingPanel.tsx   # Панель сортировки
│   └── lib/
│       ├── inventoryUtils.ts  # Утилиты инвентаря
│       ├── containerLogic.ts  # Логика контейнеров
│       └── itemValidation.ts  # Валидация предметов
├── dialogue-system/        # Диалоговая система
│   ├── api/
│   │   └── dialogueApi.ts     # API диалогов
│   ├── model/
│   │   ├── dialogueStore.ts   # Стор диалогов
│   │   ├── relationshipStore.ts # Стор отношений
│   │   ├── useDialogueEngine.ts # Движок диалогов
│   │   └── useCharacterMemory.ts # Память персонажей
│   ├── ui/
│   │   ├── DialogueWindow.tsx # Окно диалога
│   │   ├── ChoiceList.tsx     # Список выборов
│   │   ├── CharacterPortrait.tsx # Портрет персонажа
│   │   └── TextAnimation.tsx  # Анимация текста
│   └── lib/
│       ├── dialogueParser.ts  # Парсер диалогов
│       ├── emotionEngine.ts   # Движок эмоций
│       └── relationshipUtils.ts # Утилиты отношений
├── qr-scanning/            # QR сканирование
│   ├── api/
│   │   └── qrApi.ts           # API QR кодов
│   ├── model/
│   │   ├── qrStore.ts         # Стор QR сканирования
│   │   └── useQRScanner.ts    # Хук сканирования
│   ├── ui/
│   │   ├── QRCamera.tsx       # Камера QR
│   │   ├── ScanOverlay.tsx    # Оверлей сканирования
│   │   └── QRResult.tsx       # Результат сканирования
│   └── lib/
│       ├── qrDecoder.ts       # Декодер QR
│       └── cameraUtils.ts     # Утилиты камеры
└── reputation-system/      # Система репутации
    ├── api/
    │   └── reputationApi.ts   # API репутации
    ├── model/
    │   ├── reputationStore.ts # Стор репутации
    │   └── useReputationCalc.ts # Расчет репутации
    ├── ui/
    │   ├── ReputationMeter.tsx # Метр репутации
    │   ├── ReputationHistory.tsx # История изменений
    │   └── ReputationBadges.tsx # Бейджи репутации
    └── lib/
        ├── reputationCalc.ts  # Калькулятор репутации
        └── reputationUtils.ts # Утилиты репутации
```

### **📁 Entities Layer** (Бизнес-сущности)
```typescript
/entities/
├── player/                 # Сущность игрока
│   ├── api/
│   │   └── playerApi.ts       # API игрока
│   ├── model/
│   │   ├── types.ts           # Типы игрока
│   │   ├── store.ts           # Стор игрока
│   │   ├── selectors.ts       # Селекторы
│   │   └── validation.ts      # Валидация данных игрока
│   ├── ui/
│   │   ├── PlayerCard.tsx     # Карточка игрока
│   │   ├── PlayerStats.tsx    # Статистика игрока
│   │   └── PlayerAvatar.tsx   # Аватар игрока
│   └── lib/
│       ├── playerUtils.ts     # Утилиты игрока
│       └── playerCalc.ts      # Расчеты игрока
├── map-point/              # Точки на карте
│   ├── api/
│   │   └── mapPointApi.ts     # API точек карты
│   ├── model/
│   │   ├── types.ts           # Типы точек
│   │   ├── store.ts           # Стор точек
│   │   └── status.ts          # Статусы точек (discovered/researched)
│   ├── ui/
│   │   ├── MapPointMarker.tsx # Маркер точки
│   │   ├── MapPointTooltip.tsx # Тултип точки
│   │   └── MapPointDetails.tsx # Детали точки
│   └── lib/
│       ├── mapPointUtils.ts   # Утилиты точек
│       └── distanceCalc.ts    # Расчет расстояний
├── route/                  # Маршруты игрока (новое)
│   ├── api/
│   │   └── routeApi.ts        # API маршрутов
│   ├── model/
│   │   ├── types.ts           # Типы маршрутов
│   │   ├── store.ts           # Стор маршрутов
│   │   └── compression.ts     # Сжатие треков
│   ├── ui/
│   │   ├── RouteVisualization.tsx # Визуализация маршрута
│   │   └── RouteStats.tsx     # Статистика маршрута
│   └── lib/
│       ├── routeUtils.ts      # Утилиты маршрутов
│       ├── pathCompression.ts # Сжатие путей
│       └── geohashUtils.ts    # Геохеш утилиты
├── quest/                  # Квесты
│   ├── api/
│   │   └── questApi.ts        # API квестов
│   ├── model/
│   │   ├── types.ts           # Типы квестов
│   │   ├── questStore.ts      # Стор квестов
│   │   ├── progressStore.ts   # Прогресс квестов
│   │   └── validation.ts      # Валидация квестов
│   ├── ui/
│   │   ├── QuestCard.tsx      # Карточка квеста
│   │   ├── QuestProgress.tsx  # Прогресс квеста
│   │   └── QuestReward.tsx    # Награда квеста
│   └── lib/
│       ├── questUtils.ts      # Утилиты квестов
│       └── dependencyGraph.ts # Граф зависимостей
├── combat/                 # Боевая система
│   ├── api/
│   │   └── combatApi.ts       # API боевой системы
│   ├── model/
│   │   ├── types.ts           # Типы боевой системы
│   │   ├── combatStore.ts     # Стор боя
│   │   ├── cardStore.ts       # Стор карт
│   │   └── battlefieldStore.ts # Стор поля боя
│   ├── ui/
│   │   ├── Card.tsx           # Компонент карты
│   │   ├── Battlefield.tsx    # Поле боя
│   │   └── CombatStatus.tsx   # Статус боя
│   └── lib/
│       ├── combatEngine.ts    # Движок боя
│       ├── cardLogic.ts       # Логика карт
│       └── damageSystem.ts    # Система урона
├── inventory/              # Инвентарь
│   ├── api/
│   │   └── inventoryApi.ts    # API инвентаря
│   ├── model/
│   │   ├── types.ts           # Типы инвентаря
│   │   ├── inventoryStore.ts  # Стор инвентаря
│   │   ├── itemStore.ts       # Стор предметов
│   │   └── containerStore.ts  # Стор контейнеров
│   ├── ui/
│   │   ├── InventoryItem.tsx  # Предмет инвентаря
│   │   ├── Container.tsx      # Контейнер
│   │   └── ItemDetails.tsx    # Детали предмета
│   └── lib/
│       ├── inventoryLogic.ts  # Логика инвентаря
│       ├── itemUtils.ts       # Утилиты предметов
│       └── containerUtils.ts  # Утилиты контейнеров
├── visual-novel/           # Диалоговая система
│   ├── api/
│   │   ├── dialogueApi.ts     # API диалогов
│   │   └── scenarioApi.ts     # API сценариев
│   ├── model/
│   │   ├── types.ts           # Типы диалогов
│   │   ├── vnStore.ts         # Стор VN
│   │   ├── characterStore.ts  # Стор персонажей
│   │   └── relationshipStore.ts # Стор отношений
│   ├── ui/
│   │   ├── DialogueBox.tsx    # Диалоговое окно
│   │   ├── Character.tsx      # Персонаж
│   │   ├── Choice.tsx         # Выбор
│   │   └── Background.tsx     # Фон сцены
│   └── lib/
│       ├── dialogueEngine.ts  # Движок диалогов
│       ├── emotionSystem.ts   # Система эмоций
│       └── voiceSystem.ts     # Система голоса
├── world/                  # Мировые события
│   ├── api/
│   │   └── worldApi.ts        # API мира
│   ├── model/
│   │   ├── types.ts           # Типы мировых событий
│   │   ├── worldStore.ts      # Стор мира
│   │   └── eventStore.ts      # Стор событий
│   ├── ui/
│   │   ├── WorldEvent.tsx     # Мировое событие
│   │   └── EventNotification.tsx # Уведомление о событии
│   └── lib/
│       ├── worldUtils.ts      # Утилиты мира
│       └── eventScheduler.ts  # Планировщик событий
└── economy/                # Экономическая система
    ├── api/
    │   └── economyApi.ts      # API экономики
    ├── model/
    │   ├── types.ts           # Типы экономики
    │   ├── economyStore.ts    # Стор экономики
    │   └── priceStore.ts      # Стор цен
    ├── ui/
    │   ├── PriceDisplay.tsx   # Отображение цен
    │   └── TradingInterface.tsx # Интерфейс торговли
    └── lib/
        ├── economyUtils.ts    # Утилиты экономики
        └── priceCalculation.ts # Расчет цен
```

### **📁 Shared Layer** (Общие ресурсы)
```typescript
/shared/
├── api/                    # API слой
│   ├── convex/                # Convex интеграция
│   │   ├── convexClient.ts    # Клиент Convex
│   │   ├── mutations.ts       # Мутации
│   │   ├── queries.ts         # Запросы
│   │   └── subscriptions.ts   # Подписки
│   ├── exploration/           # API исследования (новое)
│   │   ├── convex.ts          # Контракты commitTrace, markResearched
│   │   ├── types.ts           # Типы API исследования
│   │   └── validation.ts      # Валидация запросов
│   ├── quests/                # API квестов
│   │   ├── questsApi.ts       # Запросы квестов
│   │   └── questValidation.ts # Валидация квестов
│   └── qr/                    # API QR кодов
│       ├── convex.ts          # Convex интеграция QR
│       └── qrValidation.ts    # Валидация QR кодов
├── ui/                     # UI библиотека
│   ├── components/            # Базовые компоненты
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── index.ts
│   │   ├── Card/
│   │   │   ├── Card.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   │   ├── Input.tsx
│   │   │   └── index.ts
│   │   ├── Modal/
│   │   │   ├── Modal.tsx
│   │   │   ├── ModalContent.tsx
│   │   │   └── index.ts
│   │   └── Tooltip/
│   │       ├── Tooltip.tsx
│   │       └── index.ts
│   ├── animations/            # Анимационные компоненты
│   │   ├── AnimatedCard.tsx   # Анимированная карточка
│   │   ├── MotionContainer.tsx # Контейнер с stagger
│   │   ├── TypewriterText.tsx # Эффект печати
│   │   ├── FadeTransition.tsx # Переходы
│   │   └── index.ts
│   ├── layout/                # Компоненты макета
│   │   ├── Container.tsx      # Контейнер
│   │   ├── Grid.tsx           # Сетка
│   │   ├── Stack.tsx          # Стек
│   │   └── Flex.tsx           # Flex контейнер
│   └── game/                  # Игровые UI компоненты
│       ├── StatCard.tsx       # Карточка статистики
│       ├── ProgressBar.tsx    # Прогресс бар
│       ├── NotificationToast.tsx # Тост уведомления
│       ├── LoadingSpinner.tsx # Спиннер загрузки
│       └── GameIcon.tsx       # Игровые иконки
├── lib/                    # Утилиты и библиотеки
│   ├── utils/                 # Общие утилиты
│   │   ├── cn.ts              # className утилиты
│   │   ├── formatters.ts      # Форматирование
│   │   ├── validators.ts      # Валидаторы
│   │   ├── debounce.ts        # Дебаунс
│   │   └── throttle.ts        # Троттлинг
│   ├── geoutils/             # Геоутилиты (новое)
│   │   ├── geohash.ts         # Геохеш функции
│   │   ├── douglasPeucker.ts  # DP-компрессия
│   │   ├── distanceCalc.ts    # Расчет расстояний
│   │   ├── lineApproximation.ts # Приближение к линии
│   │   └── zoneUtils.ts       # Утилиты зон
│   ├── events/                # Система событий
│   │   ├── eventBus.ts        # Шина событий
│   │   ├── eventTypes.ts      # Типы событий
│   │   └── eventHandlers.ts   # Обработчики событий
│   ├── outbox/                # Outbox паттерн (переиспользование)
│   │   ├── outbox.ts          # Основная логика outbox
│   │   ├── outboxTypes.ts     # Типы outbox
│   │   └── outboxSync.ts      # Синхронизация
│   ├── storage/               # Хранилище данных
│   │   ├── localStorage.ts    # Local Storage
│   │   ├── sessionStorage.ts  # Session Storage
│   │   ├── indexedDB.ts       # IndexedDB
│   │   └── storageTypes.ts    # Типы хранилища
│   ├── animations/            # Анимационные утилиты
│   │   ├── motionVariants.ts  # Варианты анимаций
│   │   ├── transitions.ts     # Переходы
│   │   └── easings.ts         # Функции сглаживания
│   ├── deviceId/             # Управление ID устройства
│   │   ├── deviceId.ts        # Генерация и хранение ID
│   │   └── deviceUtils.ts     # Утилиты устройства
│   └── convexClient/         # Convex клиент
│       ├── convexClient.ts    # Основной клиент
│       ├── convexTypes.ts     # Типы Convex
│       └── convexUtils.ts     # Утилиты Convex
├── types/                  # Общие типы
│   ├── api.ts                 # API типы
│   ├── game.ts                # Игровые типы
│   ├── ui.ts                  # UI типы
│   ├── events.ts              # Типы событий
│   ├── geography.ts           # Географические типы
│   └── player.ts              # Типы игрока
├── constants/              # Константы
│   ├── gameConstants.ts       # Игровые константы
│   ├── apiConstants.ts        # API константы
│   ├── uiConstants.ts         # UI константы
│   └── routes.ts              # Маршруты
├── hooks/                  # Общие хуки
│   ├── useLocalStorage.ts     # Хук local storage
│   ├── useSessionStorage.ts   # Хук session storage
│   ├── useDebounce.ts         # Хук дебаунса
│   ├── useThrottle.ts         # Хук троттлинга
│   ├── useGeolocation.ts      # Хук геолокации
│   ├── useEventBus.ts         # Хук событий
│   └── useDeviceId.ts         # Хук ID устройства
└── config/                 # Конфигурация
    ├── env.ts                 # Переменные окружения
    ├── constants.ts           # Общие константы
    ├── theme.ts               # Тема приложения
    ├── zones.ts               # Конфигурация зон
    └── api.ts                 # Конфигурация API
```

### **📁 Processes Layer** (Оркестрация бизнес-процессов)
```typescript
/processes/
├── exploration/            # Процесс исследования (новый)
│   ├── explorationProcess.ts # Оркестрация трекинга, синка и UI
│   ├── model/
│   │   ├── explorationStore.ts # Центральный стор процесса
│   │   └── useExplorationFlow.ts # Хук управления потоком
│   └── lib/
│       ├── explorationOrchestrator.ts # Координация всех фич
│       └── explorationUtils.ts # Утилиты процесса
├── onboarding/             # Процесс обучения новых игроков
│   ├── onboardingProcess.ts
│   ├── model/
│   │   └── onboardingStore.ts
│   └── steps/
│       ├── WelcomeStep.tsx
│       ├── TutorialStep.tsx
│       └── FirstQuestStep.tsx
└── authentication/         # Процесс аутентификации
    ├── authProcess.ts
    ├── model/
    │   └── authFlowStore.ts
    └── steps/
        ├── LoginStep.tsx
        ├── RegisterStep.tsx
        └── ProfileStep.tsx
```

#### Event-First + Optimistic Updates
- **Центральная шина событий**: `shared/lib/events`
- **Outbox pattern**: оффлайн буферизация через `localStorage`
- **Optimistic Updates**: мгновенный локальный отклик
- **Background Sync**: периодическая синхронизация с сервером
- **Conflict Resolution**: автоматическое разрешение конфликтов

#### CQRS + Client Authority Pattern
- **World Queries**: Convex запросы для мирового состояния
- **Player Commands**: локальные изменения с последующим синком
- **Hybrid Mutations**: критические действия требуют серверного подтверждения
- **Read Models**: оптимизированные представления для UI

## 🎯 Игровые механики

### **1. Advanced Visual Novel System**

#### Core Dialogue Engine
```typescript
// Продвинутая диалоговая система
interface DialogueSystem {
  // Основной диалоговый движок
  engine: {
    currentScene: DialogueScene | null
    history: DialogueEntry[]
    autoMode: boolean
    textSpeed: number          // символов в секунду (30-100)
    skipMode: 'none' | 'seen' | 'all'
    voiceVolume: number
  }
  
  // Режимы отображения
  displayModes: {
    ADV: ADVConfig             // Adventure mode - классические диалоги
    NVL: NVLConfig             // Novel mode - текст на весь экран
    CHAT: ChatConfig           // Messenger style - для современных диалогов
  }
  
  // Система автосохранений
  saveSystem: {
    autoSaveInterval: number   // Автосохранение каждые N строк
    quickSaveSlots: number     // Количество быстрых сохранений
    bookmarkPoints: SavePoint[] // Закладки в важных моментах
  }
}

// Сложная структура диалогового узла
interface DialogueNode {
  id: string
  type: 'dialogue' | 'narration' | 'choice' | 'action' | 'conditional'
  
  // Контент
  content: {
    text: string             // Основной текст
    richText?: RichTextNode[] // Форматированный текст с разметкой
    translations?: Record<string, string> // Переводы
    voiceFile?: string       // Аудио файл озвучки
  }
  
  // Персонаж
  speaker?: {
    characterId: string      // ID персонажа
    displayName: string      // Отображаемое имя
    emotion: EmotionState    // Эмоциональное состояние
    outfit?: string          // Вариант одежды/костюма
    position?: ScreenPosition // Позиция на экране
  }
  
  // Визуальные эффекты
  presentation: {
    backgroundMusic?: string // Фоновая музыка
    soundEffects?: string[]  // Звуковые эффекты
    visualEffects?: VisualEffect[] // Визуальные эффекты
    cameraShake?: boolean    // Тряска экрана
    fadeTransition?: FadeConfig // Переходы
  }
  
  // Условия и последствия
  logic: {
    conditions?: Condition[] // Условия показа
    outcomes?: Outcome[]     // Последствия выбора
    flags?: FlagChange[]     // Изменения флагов
    reputation?: ReputationChange // Изменение репутации
  }
  
  // Навигация
  navigation: {
    next?: string           // Следующий узел
    choices?: DialogueChoice[] // Варианты выбора
    randomNext?: string[]   // Случайный переход
    conditionalNext?: ConditionalTransition[]
  }
}

// Продвинутые эмоции персонажей
interface EmotionState {
  primary: BaseEmotion       // Основная эмоция
  intensity: number          // Интенсивность (0-100)
  secondary?: BaseEmotion    // Вторичная эмоция
  
  // Микроэмоции (для детального выражения)
  microExpressions?: {
    eyebrows?: 'raised' | 'furrowed' | 'normal'
    eyes?: 'wide' | 'narrow' | 'closed' | 'normal'
    mouth?: 'smile' | 'frown' | 'smirk' | 'neutral'
    blush?: boolean
    sweatDrop?: boolean
  }
  
  // Анимация эмоций
  transition?: {
    from: EmotionState
    duration: number         // Длительность перехода в мс
    easing: 'linear' | 'ease-in' | 'ease-out' | 'bounce'
  }
}

enum BaseEmotion {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  SURPRISED = 'surprised',
  CONFUSED = 'confused',
  EMBARRASSED = 'embarrassed',
  DETERMINED = 'determined',
  WORRIED = 'worried',
  EXCITED = 'excited'
}
```

#### Advanced Choice System
```typescript
// Система выборов с множественными эффектами
interface DialogueChoice {
  id: string
  text: string
  
  // Условия доступности
  availability: {
    conditions?: Condition[]   // Требования для показа
    cost?: ResourceCost[]     // Стоимость выбора
    oneTime?: boolean         // Доступен только один раз
    skillCheck?: SkillCheck   // Проверка навыков
  }
  
  // Визуальное представление
  presentation: {
    color?: ChoiceColor       // Цвет выбора (по типу)
    icon?: string            // Иконка выбора
    tooltip?: string         // Подсказка
    style?: ChoiceStyle      // Стиль отображения
  }
  
  // Последствия
  effects: {
    immediate: Outcome[]     // Мгновенные эффекты
    delayed: DelayedEffect[] // Отложенные последствия
    reputation: ReputationVector // Изменение репутации
    relationships: RelationshipChange[] // Изменение отношений
    worldState: WorldStateChange[] // Изменение мира
  }
  
  // Навигация
  destination: string | ConditionalDestination[]
}

// Типы выборов с цветовым кодированием
enum ChoiceColor {
  NEUTRAL = 'text-zinc-300',     // Нейтральный выбор
  POSITIVE = 'text-emerald-400', // Положительный/дружелюбный
  NEGATIVE = 'text-red-400',     // Негативный/агрессивный
  CAUTIOUS = 'text-blue-400',    // Осторожный/дипломатический
  BOLD = 'text-amber-400',       // Смелый/рискованный
  MYSTERIOUS = 'text-purple-400', // Загадочный/интригующий
  SKILL = 'text-teal-400'        // Требует навыков
}

// Проверки навыков в диалогах
interface SkillCheck {
  skill: SkillType
  difficulty: number           // Требуемый уровень (0-100)
  successText: string         // Текст при успехе
  failureText: string         // Текст при неудаче
  criticalSuccess?: string    // Текст при критическом успехе
  criticalFailure?: string    // Текст при критической неудаче
  
  // Модификаторы
  modifiers?: {
    reputation?: number       // Бонус от репутации
    items?: string[]          // Требуемые предметы
    relationships?: Record<string, number> // Бонус от отношений
  }
}
```

#### Character Relationship System
```typescript
// Система отношений с персонажами
interface RelationshipSystem {
  // Отношения с NPC
  relationships: Map<string, CharacterRelationship>
  
  // Система памяти персонажей
  characterMemory: Map<string, MemoryEntry[]>
  
  // Групповая динамика
  groupDynamics: GroupRelationship[]
}

interface CharacterRelationship {
  characterId: string
  
  // Многомерные отношения
  dimensions: {
    trust: number            // Доверие (-100 до +100)
    respect: number          // Уважение (-100 до +100)
    affection: number        // Привязанность (-100 до +100)
    fear: number             // Страх (0 до +100)
    dependency: number       // Зависимость (-100 до +100)
  }
  
  // История взаимодействий
  history: {
    meetings: number         // Количество встреч
    lastMeeting: Date        // Последняя встреча
    importantEvents: ImportantEvent[] // Важные события
    sharedSecrets: string[]  // Общие секреты
  }
  
  // Текущее состояние
  currentState: {
    mood: CharacterMood      // Настроение к игроку
    availability: boolean    // Доступность для диалога
    location?: string        // Текущая локация
    busyUntil?: Date        // Занят до определенного времени
  }
}

// Память персонажей о прошлых диалогах
interface MemoryEntry {
  dialogueId: string
  timestamp: Date
  significance: number       // Важность события (0-100)
  emotional_impact: number   // Эмоциональное воздействие (-100 до +100)
  tags: string[]            // Теги для поиска
  
  // Связанные воспоминания
  references?: string[]     // Ссылки на другие воспоминания
  triggers?: string[]       // Что может напомнить об этом
}
```

#### Visual Presentation Engine
```typescript
// Система презентации Visual Novel
interface PresentationEngine {
  // Экранные режимы
  layoutModes: {
    fullscreen: FullscreenLayout    // Полноэкранный режим
    windowed: WindowedLayout        // Оконный режим для диалогов
    overlay: OverlayLayout          // Наложение на игровой мир
  }
  
  // Система персонажей
  characterSystem: {
    sprites: CharacterSprite[]      // Спрайты персонажей
    positions: ScreenPosition[]     // Позиции на экране
    layers: RenderLayer[]           // Слои отрисовки
    animations: CharacterAnimation[] // Анимации персонажей
  }
  
  // Фоны и окружение
  backgrounds: {
    static: StaticBackground[]      // Статические фоны
    animated: AnimatedBackground[]  // Анимированные фоны
    parallax: ParallaxLayer[]       // Параллакс слои
    weather: WeatherEffect[]        // Погодные эффекты
  }
  
  // Эффекты и переходы
  effects: {
    textEffects: TextEffect[]       // Эффекты текста
    screenEffects: ScreenEffect[]   // Экранные эффекты
    transitions: SceneTransition[]  // Переходы между сценами
    particles: ParticleSystem[]     // Системы частиц
  }
}

// Анимации персонажей
interface CharacterAnimation {
  type: AnimationType
  duration: number
  easing: string
  
  // Типы анимаций
  transforms?: {
    position?: { x: number, y: number }
    scale?: { x: number, y: number }
    rotation?: number
    opacity?: number
  }
  
  // Специальные эффекты
  specialEffects?: {
    bounce?: boolean
    shake?: { intensity: number, frequency: number }
    glow?: { color: string, intensity: number }
    blur?: number
  }
}

enum AnimationType {
  ENTER = 'enter',           // Появление персонажа
  EXIT = 'exit',             // Исчезновение персонажа
  IDLE = 'idle',             // Простой
  TALK = 'talk',             // Разговор
  EMOTION = 'emotion',       // Смена эмоции
  GESTURE = 'gesture',       // Жест
  MOVE = 'move'              // Перемещение
}
```

#### Audio & Voice System
```typescript
// Система звука и озвучки
interface AudioSystem {
  // Голосовая озвучка
  voiceActing: {
    languages: SupportedLanguage[]   // Поддерживаемые языки
    voices: VoiceProfile[]           // Профили голосов
    synthesis: TTSConfig             // Text-to-Speech настройки
    recordedLines: AudioClip[]       // Записанные реплики
  }
  
  // Звуковое оформление
  soundDesign: {
    ambientSounds: AmbientTrack[]    // Фоновые звуки
    soundEffects: SFXLibrary         // Библиотека эффектов
    musicTracks: MusicTrack[]        // Музыкальные треки
    adaptiveAudio: AdaptiveAudioConfig // Адаптивное аудио
  }
  
  // Настройки воспроизведения
  playback: {
    autoPlay: boolean                // Автовоспроизведение
    skipVoiceOnFastText: boolean     // Пропуск озвучки при быстром тексте
    voiceVolume: number              // Громкость голоса
    sfxVolume: number                // Громкость эффектов
    musicVolume: number              // Громкость музыки
  }
}

// Профили голосов персонажей
interface VoiceProfile {
  characterId: string
  
  // Параметры голоса
  voiceParams: {
    pitch: number               // Высота тона (0.5-2.0)
    speed: number               // Скорость речи (0.5-2.0)
    volume: number              // Громкость (0-1)
    accent?: string             // Акцент
    emotion_modifier?: number    // Модификатор эмоций
  }
  
  // Записанные фразы
  recordedClips?: {
    greeting: string[]          // Приветствия
    goodbye: string[]           // Прощания
    agreement: string[]         // Согласие
    disagreement: string[]      // Несогласие
    laughter: string[]          // Смех
    surprise: string[]          // Удивление
  }
}
```

### **2. Combat Card System**

#### Core Combat Flow
```typescript
// Боевая сессия (client-authoritative)
interface CombatSession {
  id: string
  playerDeck: Card[]           // 20-30 карт игрока
  enemyDeck: Card[]           // ИИ противника  
  battlefield: BattlefieldState
  turnState: TurnPhase
  gameState: 'preparing' | 'active' | 'victory' | 'defeat'
}

// Фазы хода
enum TurnPhase {
  DRAW = 'draw',           // Добор карт
  MAIN = 'main',           // Основная фаза - разыгрывание карт
  COMBAT = 'combat',       // Разрешение боя
  END = 'end'              // Завершение хода
}
```

#### Advanced Card Mechanics

##### **Card Types & Energy System**
```typescript
interface Card {
  id: string
  template: CardTemplate
  energyCost: number           // Стоимость в энергии (0-6)
  type: 'weapon' | 'armor' | 'tactical' | 'artifact' | 'consumable'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  
  // Weapon-specific
  weaponData?: {
    damage: DamageRange       // [min, max] урон
    accuracy: number          // Шанс попадания (0-100%)
    range: 'melee' | 'short' | 'medium' | 'long'
    ammoType: AmmoType
    magazineSize: number
    currentAmmo: number
    jamChance: number         // Шанс заклинивания (0-20%)
    reloadCost: number        // Энергия на перезарядку
  }
  
  // Status effects
  statusEffects?: StatusEffect[]
  conditions?: PlayCondition[]
  
  // Upgrade path
  upgradeLevel: number
  maxUpgrades: number
}

// Урон с типизацией
interface DamageRange {
  physical: [number, number]  // Физический урон
  energy: [number, number]    // Энергетический урон  
  critical: number            // Множитель крита
  penetration: number         // Пробитие брони
}
```

##### **Battlefield Zones & Positioning**
```typescript
interface BattlefieldState {
  zones: {
    frontline: BattleZone     // Ближний бой, высокий урон
    midrange: BattleZone      // Средняя дистанция
    backline: BattleZone      // Дальний бой, снайперы
    cover: BattleZone         // Укрытие, +защита
  }
  
  // Позиционирование влияет на эффективность
  playerPosition: ZoneType
  enemyPosition: ZoneType
  
  // Модификаторы зон
  zoneEffects: {
    [K in ZoneType]: {
      damageModifier: number    // +/- урон в зависимости от зоны
      accuracyModifier: number  // +/- точность
      energyCost: number        // Стоимость смены позиции
    }
  }
}

// Позиционные тактики
interface PositionalCard extends Card {
  preferredZone?: ZoneType     // Оптимальная зона для карты
  zoneRestriction?: ZoneType[] // Карту можно играть только в этих зонах
  movementEffect?: {           // Эффект при смене позиции
    newZone: ZoneType
    additionalEffects: Effect[]
  }
}
```

##### **Advanced Weapon Mechanics**
```typescript
// Реалистичная оружейная система
interface WeaponMechanics {
  // Заклинивание и надёжность
  reliability: {
    condition: number         // 0-100%, влияет на jam chance
    maintenanceRequired: boolean
    repairCost: RepairCost
  }
  
  // Боеприпасы
  ammunition: {
    currentMag: number        // Патроны в магазине
    totalAmmo: number         // Общий запас
    ammoTypes: AmmoVariant[]  // Разные типы патронов
    reloadSpeed: number       // Ходы на перезарядку
  }
  
  // Модификации
  attachments: {
    scope?: ScopeAttachment   // +accuracy, +range
    barrel?: BarrelMod        // +damage или +accuracy
    stock?: StockMod          // +stability
    magazine?: MagazineMod    // +capacity
  }
}

// Типы боеприпасов с разными эффектами
interface AmmoVariant {
  type: 'standard' | 'armor_piercing' | 'hollow_point' | 'incendiary'
  damageModifier: number
  penetrationBonus: number
  specialEffects: StatusEffect[]
  cost: number
}
```

##### **Status Effects & Conditions**
```typescript
interface StatusEffect {
  id: string
  name: string
  type: 'buff' | 'debuff' | 'condition'
  duration: number          // -1 = permanent
  stackable: boolean
  
  effects: {
    damageOverTime?: number
    damageReduction?: number  
    accuracyModifier?: number
    energyModifier?: number
    movementRestriction?: boolean
  }
  
  // Визуальные эффекты
  visualEffect: {
    icon: string
    color: string
    animation?: AnimationType
  }
}

// Продвинутые статусы
const ADVANCED_STATUSES = {
  BLEEDING: {              // Кровотечение
    damageOverTime: 2,
    duration: 3,
    stackable: true
  },
  SUPPRESSED: {            // Подавление огнём
    accuracyModifier: -30,
    energyModifier: +1,
    duration: 2
  },
  JAMMED_WEAPON: {         // Заклинившее оружие
    movementRestriction: true,
    duration: 1            // Тратим ход на устранение
  },
  ADRENALINE: {            // Адреналин
    damageModifier: +25,
    accuracyModifier: -10,
    duration: 2
  }
} as const
```

#### Card System Architecture
```typescript
// Продвинутый движок карт
interface CardEngine {
  // Управление колодой
  deckManager: {
    buildDeck(cards: Card[]): Deck
    shuffleDeck(deck: Deck): Deck
    drawCards(count: number): Card[]
    discardCard(card: Card): void
    recyclePile(): void
  }
  
  // Валидация действий
  actionValidator: {
    canPlayCard(card: Card, target?: Target): boolean
    canActivateAbility(ability: Ability): boolean
    canMove(fromZone: ZoneType, toZone: ZoneType): boolean
    calculateEnergyCost(action: CombatAction): number
  }
  
  // ИИ противника
  aiEngine: {
    difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
    selectBestMove(gameState: CombatSession): CombatAction
    adaptTactics(playerBehavior: PlayerAction[]): void
  }
  
  // Расчёт урона
  damageCalculator: {
    calculateHit(attacker: Card, defender: Card, zone: ZoneType): HitResult
    applyStatusEffects(target: CombatUnit, effects: StatusEffect[]): void
    checkCritical(card: Card, target: CombatUnit): boolean
  }
}

// Результат атаки
interface HitResult {
  hit: boolean              // Попадание/промах
  damage: DamageDealt       // Нанесённый урон по типам
  critical: boolean         // Критическое попадание
  statusesApplied: StatusEffect[]
  armorPenetrated: boolean
  weaponJammed?: boolean    // Заклинивание после выстрела
}
```

#### Deck Building System
```typescript
interface DeckBuilder {
  // Ограничения колоды
  constraints: {
    minCards: 20
    maxCards: 30
    maxCopies: 3              // Максимум 3 копии каждой карты
    maxRarity: {              // Ограничения по редкости
      legendary: 3
      epic: 8
      rare: 15
      common: number          // Без ограничений
    }
  }
  
  // Синергии и архетипы
  archetypes: {
    SNIPER: {                 // Снайперский архетип
      bonuses: { range: +2, critChance: +15 }
      requiredCards: ['sniper_rifle', 'scope', 'ghillie_suit']
      incompatibleWith: ['BERSERKER']
    }
    BERSERKER: {             // Ближний бой
      bonuses: { damage: +20, speed: +1 }
      requiredCards: ['melee_weapon', 'heavy_armor']
      incompatibleWith: ['SNIPER']
    }
    MEDIC: {                 // Поддержка
      bonuses: { healing: +50, statusResistance: +25 }
      requiredCards: ['medkit', 'stimulants']
    }
  }
  
  // Динамическая балансировка
  balancing: {
    adjustCardsByWinRate(): void
    suggestDeckImprovements(stats: PlayerStats): Card[]
    calculateDeckPower(deck: Deck): number
  }
}

### **3. Tarkov-Style Inventory System**

#### Container-Based Storage Architecture
```typescript
// Базовая система контейнеров
interface InventoryContainer {
  id: string
  type: ContainerType
  size: GridSize              // Размер в слотах (width x height)
  items: InventoryItem[]      // Предметы в контейнере
  restrictions?: ItemFilter   // Ограничения на типы предметов
  parent?: string            // ID родительского контейнера
}

// Типы контейнеров
enum ContainerType {
  STASH = 'stash',           // Основное хранилище
  BACKPACK = 'backpack',     // Рюкзак
  VEST = 'vest',             // Разгрузочный жилет
  POCKETS = 'pockets',       // Карманы
  SECURE = 'secure',         // Защищённый контейнер
  WEAPON_CASE = 'weapon_case', // Кейс для оружия
  AMMO_BOX = 'ammo_box'      // Коробка патронов
}

// Размеры контейнеров (в ячейках)
interface GridSize {
  width: number              // Ширина в ячейках
  height: number             // Высота в ячейках
  cells: number              // Общее количество ячеек
}
```

#### Advanced Item System
```typescript
interface InventoryItem {
  id: string
  templateId: string         // Ссылка на шаблон предмета
  size: ItemSize            // Размер предмета в ячейках
  position: GridPosition    // Позиция в контейнере
  stackSize: number         // Размер стака (для стакующихся предметов)
  condition: number         // Состояние предмета (0-100%)
  
  // Характеристики
  properties: {
    weight: number          // Вес в граммах
    value: number           // Стоимость
    rarity: ItemRarity
    durability?: number     // Текущая прочность
    maxDurability?: number  // Максимальная прочность
  }
  
  // Специальные свойства
  modSlots?: ModSlot[]      // Слоты для модификаций (оружие)
  contains?: InventoryContainer // Вложенный контейнер (рюкзаки, кейсы)
  ammoData?: AmmoData       // Данные о патронах
  keyData?: KeyData         // Данные о ключах
  
  // Метаданные
  metadata: {
    foundDate: Date
    foundLocation?: string
    isQuestItem: boolean
    isSecure: boolean       // Нельзя потерять при смерти
  }
}

// Размер предмета
interface ItemSize {
  width: number             // Ширина в ячейках
  height: number            // Высота в ячейках
  rotatable: boolean        // Можно ли поворачивать
  shape?: CellPattern[]     // Сложная форма (не прямоугольник)
}

// Позиция в сетке
interface GridPosition {
  x: number                 // Координата X (левый верхний угол)
  y: number                 // Координата Y (левый верхний угол)
  rotation: 0 | 90 | 180 | 270 // Поворот предмета
}
```

#### Drag & Drop Validation System
```typescript
interface InventoryLogic {
  // Проверка возможности размещения
  canPlaceItem(
    item: InventoryItem,
    container: InventoryContainer,
    position: GridPosition
  ): ValidationResult
  
  // Проверка пересечений
  checkCollisions(
    item: InventoryItem,
    container: InventoryContainer,
    position: GridPosition
  ): CollisionResult
  
  // Автоматическое размещение
  findBestPosition(
    item: InventoryItem,
    container: InventoryContainer
  ): GridPosition | null
  
  // Перемещение предметов
  moveItem(
    itemId: string,
    fromContainer: string,
    toContainer: string,
    newPosition: GridPosition
  ): MoveResult
}

// Результат валидации
interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: string[]
  autoCorrect?: GridPosition  // Предложение исправления
}

// Типы ошибок размещения
enum ValidationError {
  ITEM_TOO_LARGE = 'item_too_large',
  POSITION_OCCUPIED = 'position_occupied', 
  INVALID_ITEM_TYPE = 'invalid_item_type',
  CONTAINER_FULL = 'container_full',
  WEIGHT_LIMIT_EXCEEDED = 'weight_limit_exceeded',
  ITEM_RESTRICTIONS = 'item_restrictions'
}
```

#### Raid Preparation System
```typescript
// Система подготовки к "рейду" (выходу в мир)
interface RaidPreparation {
  // Подготовка снаряжения
  prepareLoadout(selectedItems: ItemSelection): PrepResult
  
  // Проверка готовности
  validateLoadout(loadout: RaidLoadout): LoadoutValidation
  
  // Применение снаряжения
  applyLoadout(loadout: RaidLoadout): void
  
  // Возврат с рейда
  returnFromRaid(
    survivedItems: InventoryItem[],
    lootedItems: InventoryItem[],
    experience: RaidExperience
  ): RaidResult
}

// Снаряжение для рейда
interface RaidLoadout {
  primaryWeapon?: InventoryItem
  secondaryWeapon?: InventoryItem
  armor: InventoryItem[]
  backpack?: InventoryItem
  consumables: InventoryItem[]
  ammunition: AmmoLoadout
  
  // Ограничения
  totalWeight: number
  totalVolume: number
  estimatedValue: number
}

// Управление патронами
interface AmmoLoadout {
  magazines: Magazine[]       // Снаряженные магазины
  looseAmmo: AmmoStack[]     // Россыпные патроны
  ammoTypes: AmmoType[]      // Типы доступных патронов
  
  // Автозаполнение
  autoFillMagazines(): void
  optimizeAmmoDistribution(): void
}
```

#### Container Hierarchy & Nesting
```typescript
// Иерархическая система контейнеров
interface ContainerHierarchy {
  // Корневые контейнеры (принадлежат игроку)
  root: {
    stash: InventoryContainer     // Основное хранилище
    gear: EquipmentSlots         // Экипированные предметы
    secure: SecureContainer      // Защищённый контейнер
  }
  
  // Временные контейнеры
  temporary: {
    loot: InventoryContainer     // Лут с локации
    trader: InventoryContainer   // Предметы торговца
    repair: InventoryContainer   // Предметы на ремонте
  }
  
  // Методы навигации
  findContainer(itemId: string): InventoryContainer | null
  getContainerPath(containerId: string): string[]
  moveToParent(itemId: string): boolean
  expandContainer(containerId: string): InventoryContainer[]
}

// Слоты экипировки
interface EquipmentSlots {
  head?: InventoryItem          // Голова (шлем, очки)
  earpiece?: InventoryItem      // Наушники
  face?: InventItem            // Лицо (маска)
  armor?: InventoryItem         // Бронежилет
  backpack?: InventoryItem      // Рюкзак
  primaryWeapon?: InventoryItem // Основное оружие
  secondaryWeapon?: InventoryItem // Запасное оружие
  holster?: InventoryItem       // Пистолет
  pockets: InventoryItem[]      // Карманы (4 слота)
  secure?: InventoryItem        // Защищённый контейнер
}
```

#### Smart Sorting & Organization
```typescript
interface InventoryOrganizer {
  // Автоматическая сортировка
  autoSort(container: InventoryContainer, criteria: SortCriteria): void
  
  // Умная упаковка
  optimizePacking(items: InventoryItem[]): PackingResult
  
  // Поиск предметов
  searchItems(query: SearchQuery): InventoryItem[]
  
  // Группировка
  groupSimilarItems(container: InventoryContainer): ItemGroup[]
  
  // Рекомендации
  suggestOptimizations(container: InventoryContainer): Suggestion[]
}

// Критерии сортировки
enum SortCriteria {
  BY_TYPE = 'by_type',         // По типу предмета
  BY_VALUE = 'by_value',       // По стоимости
  BY_WEIGHT = 'by_weight',     // По весу
  BY_SIZE = 'by_size',         // По размеру
  BY_RARITY = 'by_rarity',     // По редкости
  BY_CONDITION = 'by_condition', // По состоянию
  CUSTOM = 'custom'            // Пользовательская
}

// Результат упаковки
interface PackingResult {
  layout: ItemPlacement[]      // Оптимальное размещение
  efficiency: number           // Эффективность использования места (0-100%)
  unusedSpace: number          // Неиспользованных ячеек
  suggestions: string[]        // Советы по улучшению
}
```

### **4. Spatial Exploration System**

#### Location-Based Features
- **QR-код сканирование** локаций для AR-опыта
- **Геозонирование** с буферизацией для предотвращения flicker
- **Кластеризация маркеров** по типам (квесты, NPC, аномалии)
- **Spatial indexing** через quadtree и геохеши

#### Marker Lifecycle
```typescript
enum MarkerStatus {
  SPAWNED = 'spawned',
  ACTIVE = 'active',
  COOLDOWN = 'cooldown',
  DESPAWNED = 'despawned'
}
```

### **4. Reputation System**

#### Multi-Dimensional Model
- **Четыре оси репутации**:
  - Combat: боевые навыки и агрессия
  - Exploration: исследовательские способности
  - Social: дипломатия и отношения
  - Reliability: надежность и последовательность

#### Temporal Decay
- **Экспоненциальное затухание** событий со временем
- **Различные half-life константы** для разных типов событий

### **5. Quest Framework**

#### Dependency Graph
- **DAG структура** с предусловиями и постусловиями
- **Топологическая сортировка** для определения доступных квестов
- **Условные ветвления** на основе репутации и флагов

#### Procedural Generation
- **Грамматическая генерация** квестов по архетипам
- **Контекстуальная адаптация** под игрока (локация, репутация, фаза)

## 🎨 Advanced UI/UX Design System

### **Dark Cyberpunk Aesthetic**
Основанная на темной цветовой схеме с неоновыми акцентами и стеклянными эффектами.

#### **Color System & Palette**
```typescript
// Основная цветовая схема (на основе HomePage.tsx)
interface ColorPalette {
  // Базовые темные тона (zinc palette)
  background: {
    primary: 'bg-zinc-900',           // Основной фон
    secondary: 'bg-zinc-800',         // Вторичный фон
    surface: 'bg-zinc-900/50',        // Поверхности с прозрачностью
    elevated: 'bg-zinc-800/80',       // Возвышенные элементы
    overlay: 'bg-black/60'            // Модальные окна
  }
  
  // Градиенты для глубины
  gradients: {
    main: 'bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900',
    card: 'bg-gradient-to-r from-emerald-900/40 to-blue-900/40',
    button: 'bg-gradient-to-r from-blue-600 to-blue-700',
    danger: 'bg-gradient-to-r from-red-600 to-red-700'
  }
  
  // Семантические цветные акценты (как в QuickActions)
  accents: {
    primary: 'text-emerald-400',      // QR Scanner, Success
    secondary: 'text-blue-400',       // Map, Info
    combat: 'text-red-400',           // Combat System
    inventory: 'text-amber-400',      // Inventory
    quests: 'text-purple-400',        // Quests
    settings: 'text-zinc-400',        // Settings
    neutral: 'text-zinc-300',         // Нейтральный
    muted: 'text-zinc-400'            // Приглушенный
  }
}

// Цветовые схемы для игровых элементов (из HomePage)
const GAME_ELEMENT_COLORS = {
  quickActions: {
    qr: 'text-emerald-400 bg-emerald-900/30 border-emerald-700/50',
    map: 'text-blue-400 bg-blue-900/30 border-blue-700/50',
    quests: 'text-purple-400 bg-purple-900/30 border-purple-700/50',
    combat: 'text-red-400 bg-red-900/30 border-red-700/50',
    inventory: 'text-amber-400 bg-amber-900/30 border-amber-700/50',
    settings: 'text-zinc-400 bg-zinc-900/30 border-zinc-700/50'
  }
} as const
```

### **Advanced Animation Framework**
```typescript
// Продвинутая система анимаций с Framer Motion (на основе HomePage.tsx)
interface AnimationSystem {
  // Базовые анимационные варианты (как в HomePage)
  variants: {
    // Появление элементов
    fadeIn: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6 }
    },
    
    // Stagger анимации для списков (MotionContainer)
    staggerContainer: {
      animate: {
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.1
        }
      }
    },
    
    // Hover эффекты для интерактивных элементов (QuickActions)
    interactive: {
      rest: { scale: 1, y: 0 },
      hover: { 
        scale: 1.05, 
        y: -4,
        transition: { duration: 0.2 }
      },
      tap: { scale: 0.95 }
    },
    
    // Специальные игровые анимации
    gameCard: {
      rest: { scale: 1, z: 0 },
      hover: { 
        scale: 1.08, 
        y: -2,
        transition: { duration: 0.2 }
      }
    }
  }
  
  // Специальные эффекты
  effects: {
    // Статистические карточки (как в Player Status)
    statHover: {
      y: -2,
      transition: { duration: 0.2 }
    },
    
    // Пульсирующий эффект для важных элементов
    glowPulse: {
      boxShadow: [
        '0 0 20px rgba(52, 211, 153, 0.3)',
        '0 0 40px rgba(52, 211, 153, 0.6)',
        '0 0 20px rgba(52, 211, 153, 0.3)'
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  }
}
```

#### **Glass Morphism & Depth System**
```typescript
// Система стеклянных эффектов (на основе HomePage backdrop-blur)
interface GlassMorphismSystem {
  // Уровни прозрачности
  opacity: {
    subtle: 'bg-zinc-900/50 backdrop-blur-sm',      // Карточки
    medium: 'bg-zinc-800/80 backdrop-blur-md',      // Панели
    strong: 'bg-zinc-900/80 backdrop-blur-lg',      // Модальные окна
  }
  
  // Рамки и границы (как в HomePage)
  borders: {
    card: 'border border-zinc-700',                 // Обычные карточки
    accent: 'border border-emerald-700/50',         // Акцентные карточки
    interactive: 'border border-zinc-700/50 hover:border-zinc-600/70'
  }
}

// Готовые glass компоненты (как в HomePage)
const GLASS_COMPONENTS = {
  card: 'bg-zinc-900/50 border border-zinc-700',
  statusCard: 'bg-gradient-to-r from-emerald-900/40 to-blue-900/40 border-emerald-700/50',
  actionCard: 'backdrop-blur-sm transition-all duration-200',
  modal: 'bg-zinc-900/80 backdrop-blur-lg border border-zinc-600/50'
}
```

### **Component System & Design Tokens**
```typescript
// Анимированные компоненты (на основе HomePage)
const ANIMATED_COMPONENTS = {
  // AnimatedCard с различными вариантами
  AnimatedCard: {
    variants: ['default', 'glow', 'status', 'interactive'],
    animations: {
      default: 'hover:scale-105 hover:shadow-lg',
      glow: 'animate-pulse shadow-emerald-500/20',
      status: 'hover:y-[-2px] transition-all duration-200',
      interactive: 'whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }}'
    }
  },
  
  // MotionContainer для stagger эффектов (QuickActions grid)
  MotionContainer: {
    staggerDelay: 0.1,
    childVariants: 'fadeIn',
    gridLayout: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'
  },
  
  // Специальные игровые компоненты
  StatCard: {
    layout: 'flex items-center justify-center mb-2',
    hoverEffect: 'whileHover={{ y: -2 }}',
    iconColors: {
      target: 'text-purple-400',
      trending: 'text-emerald-400',
      calendar: 'text-blue-400',
      award: 'text-yellow-400'
    }
  }
}
```

### **Typography System**
```typescript
// Типографическая система (на основе HomePage)
interface TypographySystem {
  // Иерархия заголовков
  headings: {
    h1: 'text-4xl font-bold text-zinc-100',        // QR-Boost заголовок
    h2: 'text-xl font-semibold text-zinc-100',     // Статус игрока
    h3: 'text-lg font-semibold text-zinc-100',     // Активные квесты
    section: 'text-xl font-semibold text-zinc-100 mb-4' // Секции
  }
  
  // Основной текст
  body: {
    primary: 'text-zinc-100',                      // Основной контент
    secondary: 'text-zinc-400',                    // Описания
    accent: 'text-emerald-300',                    // Акценты (фаза игрока)
    muted: 'text-zinc-400'                         // Приглушенный текст
  }
  
  // UI элементы
  ui: {
    button: 'font-medium text-zinc-100 text-sm',   // Кнопки
    stat: 'text-lg font-semibold text-zinc-100',   // Статистика
    badge: 'text-2xl font-bold text-emerald-400',  // Значения статистики
    caption: 'text-xs text-zinc-400'               // Подписи
  }
}
```

### **Responsive & Mobile-First Design**
```typescript
// Адаптивная система (на основе HomePage grid layouts)
interface ResponsiveSystem {
  // Сетки HomePage
  layouts: {
    dashboard: {
      mobile: 'max-w-6xl mx-auto p-4',
      spacing: 'mb-8'
    },
    
    quickActions: {
      mobile: 'grid-cols-2',
      tablet: 'md:grid-cols-3', 
      desktop: 'lg:grid-cols-6',
      gap: 'gap-4'
    },
    
    statsGrid: {
      mobile: 'grid-cols-2',
      tablet: 'md:grid-cols-4',
      gap: 'gap-4'
    },
    
    contentGrid: {
      mobile: 'grid',
      tablet: 'md:grid-cols-2',
      gap: 'gap-6'
    }
  }
  
  // Размеры touch-элементов
  touchTargets: {
    minimum: '44px',                               // Минимальный размер
    quickAction: 'p-4',                           // Padding для QuickActions
    icon: 'size={32}',                            // Размер иконок
  }
}
```

## 📊 Система данных

### **Convex Schema**
```typescript
// Основные таблицы
- users: аутентификация и профили
- player_state: фаза, репутация, инвентарь
- quest_progress: текущее состояние квестов
- map_points: пространственные данные локаций
- quest_registry: каталог доступных квестов
- mappoint_bindings: привязки точек к квестам
- world_state: глобальные флаги и состояние мира
```

### **State Management**
- **Zustand сторы** для каждого домена
- **Persistence** через localStorage для оффлайн режима
- **Optimistic updates** для мгновенного отклика

### **Caching Strategy**
- **Multi-tier caching**: device storage → memory → edge cache
- **Predictive loading** на основе паттернов движения игрока
- **TTL policies** для актуальности данных

## 🔧 Инструменты разработки

### **Build System**
- **Vite** для быстрой разработки и сборки
- **TypeScript** с strict mode для типобезопасности
- **ESLint + Prettier** для качества кода

### **Testing Infrastructure**
- **Vitest** для unit тестов
- **React Testing Library** для компонентных тестов
- **Contract testing** между слоями с Zod схемами

### **DevOps & Monitoring**
- **Feature flags** для поэтапного rollout
- **Performance monitoring** FPS, memory usage, bundle size
- **Error tracking** и alerting система

## 🎯 Roadmap интеграции

## 📈 Метрики успеха

### **Technical KPIs**
- **Bundle size** < 500KB gzipped
- **Lighthouse score** > 90 для всех метрик
- **Event consistency** 99.9% uptime
- **Offline capability** 100% базового функционала

### **Game KPIs**
- **Player retention** D1: 70%, D7: 40%, D30: 20%
- **Quest completion rate** > 80% для основных квестов
- **Combat engagement** среднее время сессии > 15 минут
- **Location discovery** > 50 уникальных локаций в месяц

---

*Этот GDD объединяет техническую архитектуру, игровые механики и инструменты разработки Grenzwanderer. Проект построен на принципах scalability, maintainability и engaging gameplay.*

## 🛣️ Project Roadmap & Development Timeline

### **Фаза 0: Инициализация (Ноябрь 2024)**
**"От идеи до GitHub репозитория"**

#### ✅ Completed:
- [x] **Создание GitHub репозитория** `grenzwanderer`
- [x] **Инициализация проекта** с Vite + React 19 + TypeScript
- [x] **Настройка основного стека**:
  - React 19 + TypeScript + Vite
  - Tailwind CSS для стилизации
  - ESLint + Prettier для качества кода
- [x] **Базовая структура папок** по FSD принципам
- [x] **Первый commit** и настройка автоматизации

**Результат:** Рабочая среда разработки с hot reload и типизацией.

---

### **Фаза 1: Foundation & Core Systems (Декабрь 2024)**
**"Создание фундамента игры"**

#### ✅ Completed:
- [x] **Convex Backend интеграция**
  - Настройка real-time базы данных
  - Схема для игроков, квестов, точек карты
  - Аутентификация через Clerk
- [x] **Базовая архитектура FSD**
  - `/entities/` для бизнес-логики
  - `/shared/` для общих компонентов
  - `/pages/` для страниц приложения
  - `/widgets/` для сложных UI блоков
- [x] **Core UI System**
  - Компоненты: AnimatedCard, MotionContainer, TypewriterText
  - Framer Motion анимации
  - Responsive design с мобильным фокусом
- [x] **Event System Architecture**
  - Централизованная шина событий
  - Outbox pattern для офлайн режима
  - Event sourcing для критических действий

#### 🏗️ Key Files Created:
```
├── client/src/app/ConvexProvider.tsx
├── client/src/shared/lib/events/eventBus.ts
├── client/src/shared/lib/outbox.ts
├── client/src/shared/ui/AnimatedCard.tsx
├── client/convex/schema.ts
└── client/package.json (основные зависимости)
```

**Результат:** Прочная техническая основа с real-time синхронизацией.

---

### **Фаза 2: Core Gameplay Features (Январь 2025)**
**"Основные игровые механики"**

#### ✅ Completed:

##### **Visual Novel System**
- [x] **Диалоговый движок** (`entities/visual-novel/`)
  - Zustand store для состояния диалогов
  - Компоненты: DialogueBox, CharacterSprites, ChoiceMenu
  - Система эмоций и анимаций персонажей
- [x] **Контент и сценарии**
  - 12+ диалоговых файлов с квестовыми сюжетами
  - Система выборов с последствиями
  - Интеграция с репутационной системой

##### **Quest System**
- [x] **Продвинутая система квестов** (`entities/quest/`)
  - Event sourcing архитектура
  - State machines для сложных квестов
  - Граф зависимостей между квестами
- [x] **Quest Progress Management**
  - Action coordinator для автоматизации
  - Условная логика и outcomes
  - Интеграция с диалогами

##### **Map System**
- [x] **Mapbox интеграция** (`widgets/MapWidget/`)
  - Интерактивная карта с маркерами
  - Геолокация и пространственное индексирование
  - Система видимости точек по фазам игрока
- [x] **Map Point Management**
  - Spatial indexing через geohash
  - Кеширование видимых точек
  - Tooltip система для POI

#### 🏗️ Key Files Created:
```
├── client/src/entities/visual-novel/model/store.ts
├── client/src/entities/quest/domain/projection.ts
├── client/src/widgets/MapWidget/model/useClientVisiblePoints.ts
├── client/src/shared/storage/ (12 диалоговых файлов)
└── client/convex/quests.ts
```

**Результат:** Полноценная визуальная новелла с квестами и интерактивной картой.

---

### **Фаза 3: Combat & Inventory (Февраль 2025)**
**"Боевая система и управление предметами"**

#### ✅ Completed:

##### **Card-Based Combat System**
- [x] **Боевой движок** (`entities/combat/`)
  - Карточная система с энергией и ходами
  - ИИ противника с разными уровнями сложности
  - Система статусных эффектов
- [x] **Карты и колоды**
  - 20+ боевых карт с разными эффектами
  - Deck builder для создания колод
  - Система амуниции и оружия
- [x] **Combat UI**
  - Drag & Drop для карт
  - Анимированное поле боя
  - Real-time обновления состояния

##### **Inventory System**
- [x] **Система инвентаря** (`entities/inventory/`)
  - Grid-based размещение предметов
  - Типизированные предметы и контейнеры
  - Валидация размещения
- [x] **Equipment Management**
  - Экипировка снаряжения
  - Модификация предметов
  - Система веса и ограничений

#### 🏗️ Key Files Created:
```
├── client/src/entities/combat/model/store.ts
├── client/src/entities/combat/ui/EnhancedCombatView.tsx
├── client/src/entities/inventory/model/store.ts
├── client/src/entities/inventory/ui/EnhancedInventoryGrid.tsx
└── client/src/pages/EnhancedCombatPage.tsx
```

**Результат:** Полнофункциональная боевая система с управлением снаряжением.

---

### **Фаза 4: User Experience & Polish (Март 2025)**
**"Завершение пользовательского опыта"**

#### ✅ Completed:

##### **Enhanced HomePage**
- [x] **Dashboard дизайн** с темной cyberpunk эстетикой
- [x] **Player Status Card** с прогрессом и статистикой
- [x] **Quick Actions Grid** с 6 основными действиями
- [x] **Active Quests List** с real-time обновлениями
- [x] **System Status** с уведомлениями

##### **Navigation & Layout**
- [x] **Responsive navigation** (`widgets/Navbar/`)
- [x] **Layout системы** (MainLayout, FullScreenLayout)
- [x] **Page routing** с защищенными маршрутами

##### **QR Scanning Foundation**
- [x] **QR Scan страница** заготовка
- [x] **API интеграция** для QR кодов
- [x] **Camera access** подготовка

#### 🏗️ Key Files Created:
```
├── client/src/pages/HomePage.tsx
├── client/src/widgets/Navbar/Navbar.tsx
├── client/src/app/layouts/MainLayout.tsx
├── client/src/pages/QRScanPage.tsx
└── client/src/shared/api/qr/convex.ts
```

**Результат:** Полированный пользовательский интерфейс с навигацией.

---

## 🎯 **Текущее состояние проекта (Сентябрь 2025)**

### **✅ Что работает и готово к использованию:**

#### **Core Systems (100% functional)**
- ✅ **Visual Novel** - полнофункциональная диалоговая система
- ✅ **Quest Management** - сложные квесты с зависимостями  
- ✅ **Combat System** - карточные бои с ИИ
- ✅ **Inventory** - grid-based управление предметами
- ✅ **Map Widget** - интерактивная карта с геолокацией
- ✅ **Authentication** - Clerk интеграция
- ✅ **Real-time sync** - Convex backend

#### **UI/UX (95% functional)**
- ✅ **HomePage** - современный dashboard
- ✅ **Navigation** - responsive меню
- ✅ **Animations** - Framer Motion transitions
- ✅ **Mobile-first** - адаптивный дизайн

#### **Developer Experience (100%)**
- ✅ **Hot reload** - мгновенная разработка
- ✅ **TypeScript** - полная типизация
- ✅ **FSD Architecture** - модульная структура
- ✅ **Testing setup** - Vitest конфигурация
- ✅ **Linting** - ESLint + boundaries plugin

### **⚠️ В разработке/требуется завершение:**
- 🔧 **QR Scanning** - базовая структура есть, нужна камера
- 🔧 **PWA features** - offline capabilities
- 🔧 **Settings Page** - пользовательские настройки

---

## 🚀 **Roadmap будущего развития**

### **Фаза 5: Location-Based Core (Q4 2025)**
**"Геолокационное исследование"**

#### 🎯 Высокий приоритет:
- [ ] **Path Tracking System** (`features/path-tracking/`)
  - `useRouteRecorder` для записи перемещений
  - Douglas-Peucker компрессия треков
  - Геофенсинг зон через геохеш
- [ ] **Zone Discovery** (`features/zone-discovery/`)
  - API `exploration.commitTrace` (Convex)
  - Обнаружение POI при прохождении маршрута
  - Система статусов: not_found → discovered → researched
- [ ] **POI Inspection** (`features/poi-inspection/`)
  - QR сканирование для исследования точек
  - API `exploration.markResearched`
  - Интеграция с наградами и флагами

#### 🔧 Техническая реализация:
```typescript
// Новые entities
entities/route/                 # Хранение треков
├── model/compression.ts        # DP компрессия
├── api/routeApi.ts            # Convex интеграция
└── ui/RouteVisualization.tsx  # Визуализация пути

// Новые features  
features/path-tracking/         # Запись маршрутов
features/zone-discovery/        # Обнаружение зон  
features/poi-inspection/        # Исследование точек

// Новый shared функционал
shared/lib/geoutils/           # Геоутилиты
├── geohash.ts                 # Геохеш функции
├── douglasPeucker.ts          # Компрессия треков
└── zoneUtils.ts               # Зонирование

// Convex schema расширения
point_discoveries: {           # Новая таблица
  deviceId, userId, pointKey,
  discoveredAt, researchedAt
}
```

**Цель:** Полноценное геолокационное исследование с трекингом.

---

### **Фаза 6: Phone Points & Discovery UI (Q1 2026)**
**"Мобильный интерфейс исследования"**

#### 🎯 Приоритеты:
- [ ] **Phone Points** (`features/phone-points/`)
  - Список открытых точек с фильтрами
  - Статусы discovered/researched
  - Интеграция с картой для навигации
- [ ] **Enhanced QR Scanner**
  - Camera API интеграция
  - AR overlay для сканирования
  - Offline QR code validation
- [ ] **Discovery Notifications**
  - Push уведомления при входе в зоны
  - Achievement система
  - Progress tracking

#### 🔧 UI Компоненты:
```typescript
features/phone-points/ui/
├── PointsList.tsx             # Список точек
├── PointFilters.tsx           # Фильтры по статусу/типу
├── PointItem.tsx              # Карточка точки
└── StatusBadges.tsx           # Бейджи статусов

features/qr-scanning/ui/
├── QRCamera.tsx               # Камера компонент
├── ScanOverlay.tsx            # AR оверлей
└── QRResult.tsx               # Результат сканирования
```

**Цель:** Интуитивный мобильный интерфейс для исследования.

---

### **Фаза 7: PWA & Offline Excellence (Q2 2026)**
**"Progressive Web App возможности"**

#### 🎯 PWA Features:
- [ ] **Service Worker Setup**
  - Кеширование статических ассетов
  - Background sync для данных
  - Offline gameplay core functions
- [ ] **Push Notifications**
  - Геолокационные триггеры
  - Quest completion alerts
  - World events notifications
- [ ] **Install Prompt**
  - Add to homescreen experience
  - App icon и splash screen
  - Native-like navigation

#### 🔧 Техническая реализация:
```typescript
// PWA конфигурация
vite.config.ts                 # PWA plugin setup
public/manifest.json           # App manifest
sw.ts                          # Service worker

// Offline capabilities
shared/lib/storage/
├── indexedDB.ts              # Большие данные
├── localStorage.ts           # Критические данные  
└── cacheManager.ts           # Управление кешем

// Background sync
shared/lib/sync/
├── backgroundSync.ts         # Фоновая синхронизация
├── conflictResolution.ts     # Разрешение конфликтов
└── syncStrategies.ts         # Стратегии синхронизации
```

**Цель:** Полноценное PWA с офлайн возможностями.

---

### **Фаза 8: Advanced Features (Q3 2026)**
**"Продвинутые игровые механики"**

#### 🎯 Расширенная функциональность:
- [ ] **Multiplayer Events**
  - Совместные квесты рядом находящихся игроков
  - World events с групповым участием
  - Социальные элементы и лидерборды
- [ ] **Advanced Combat**
  - PvP элементы в аномальных зонах
  - Clan система и групповые бои
  - Seasonal events и турниры
- [ ] **Economic System**
  - Торговля между игроками
  - Динамические цены на ресурсы
  - Crafting и производство предметов

#### 🔧 Новые системы:
```typescript
entities/multiplayer/          # Мультиплеер
entities/economy/              # Экономика
entities/world/                # Мировые события

features/trading/              # Торговля
features/crafting/             # Производство
features/social/               # Социальные функции
```

**Цель:** Богатый multiplayer и экономический контент.

---

### **Фаза 9: Content & Balance (Q4 2026)**
**"Контент и балансировка"**

#### 🎯 Контентные цели:
- [ ] **Expanded World**
  - 500+ точек интереса в Freiburg
  - 10+ различных районов города
  - Сезонные события и изменения мира
- [ ] **Quest Content**
  - 100+ квестов различных типов
  - Сложные цепочки заданий
  - Множественные концовки основного сюжета
- [ ] **Balance & Analytics**
  - Система метрик и аналитики
  - A/B тестирование новых фич
  - Динамическая балансировка сложности

**Цель:** Обширный и сбалансированный игровой мир.

---

### **Фаза 10: Polish & Launch (Q1 2027)**
**"Полировка и запуск"**

#### 🎯 Предрелизные задачи:
- [ ] **Performance Optimization**
  - Bundle size optimization
  - Memory leak prevention
  - Battery usage optimization
- [ ] **Accessibility**
  - Screen reader support
  - Keyboard navigation
  - Color blind friendly design
- [ ] **Localization**
  - English translation
  - German localization
  - Cultural adaptation
- [ ] **Marketing & Community**
  - Beta testing program
  - Community Discord
  - Launch campaign

**Цель:** Готовый к публичному релизу продукт.

---

## 📈 **Критерии успеха по фазам**

### **Immediate Goals (Фаза 5)**
- [ ] 📍 **20+ точек** можно обнаружить через геолокацию
- [ ] 🚶 **Path tracking** работает в фоновом режиме
- [ ] 📱 **QR сканирование** функционально

### **Medium-term Goals (Фаза 6-7)**
- [ ] 📱 **PWA install** на мобильных устройствах  
- [ ] 🔄 **Offline mode** для core функций
- [ ] 🏆 **Achievement система** мотивирует исследование

### **Long-term Goals (Фаза 8-10)**
- [ ] 👥 **100+ активных игроков** ежедневно
- [ ] 🌍 **Multiplayer события** еженедельно
- [ ] ⭐ **4.5+ рейтинг** в app stores

---

## 🛠️ **Development Guidelines**

### **Архитектурные принципы:**
1. **FSD First** - всегда следовать Feature-Sliced Design
2. **Mobile First** - приоритет мобильного опыта
3. **Type Safety** - строгая типизация TypeScript
4. **Performance** - оптимизация для слабых устройств
5. **Accessibility** - доступность с первого дня

### **Процесс разработки:**
1. **Feature Branch** для каждой новой фичи
2. **Code Review** перед merge в main
3. **Testing** - unit tests для критической логики
4. **Documentation** - обновление Plan.md после изменений
5. **Incremental** - маленькие итерации и regular deploys

### **Приоритизация:**
- 🔥 **P0**: Core location-based gameplay
- ⚡ **P1**: PWA capabilities и offline mode  
- 🎨 **P2**: Advanced features и multiplayer
- ✨ **P3**: Polish и дополнительный контент

---

*Этот roadmap обеспечивает поэтапное развитие Grenzwanderer от текущего состояния до полноценного location-based PWA с богатой функциональностью.*

Цели

Трассировка пути: локально копить трек и обрабатывать геофенсинг.
Синхронизация: при входе в зону отправлять свежий сегмент пути на сервер.
Данные с сервера: список точек, по которым прошёл игрок, и точки зоны.
Состояния точек: not_found → discovered → researched, с отображением на “телефоне”.
Разрез по FSD

Entities:
entities/map-point: статус точки и вычислительные поля.
entities/route (новое): хранение и агрегация треков, таймлайны, компрессия.
Features:
features/path-tracking: запись и дебаунс трека, триггеры входа в зону.
features/zone-discovery: отправка трека, применение ответа (видимость/статусы).
features/poi-inspection: пометка researched при взаимодействии/QR.
features/phone-points: список/фильтр точек и статусы на “телефоне”.
Processes:
processes/exploration: оркестрация трекинга, синка и UI.
Widgets/Pages:
widgets/MapWidget расширить подсветкой “discovered/researched”.
Страница телефона: список точек и фильтры (можно в pages/MapPage.tsx:1 или новая).
Shared:
shared/lib/geoutils (новое): геохеш/DP-компрессия/приближение к линии.
shared/lib/outbox переиспользовать для оффлайн батчей (client/src/shared/lib/outbox.ts:1).
shared/api/exploration/convex.ts (новое): контракты commitTrace, markResearched.
Модель данных (Convex)

Таблицы (client/convex/schema.ts:1):
point_discoveries: { deviceId?, userId?, pointKey, discoveredAt, researchedAt, updatedAt } с индексами по (deviceId, pointKey) и (userId, pointKey).
zones (опционально): { key, kind: 'circle'|'polygon'|'geohash', shape, updatedAt } или использовать гео-ячейки без таблицы (см. варианты ниже).
player_traces (опционально): хранение последних N сегментов/сжатых треков для аналитики/проверки.
Состояния точек:
not_found: нет записи в point_discoveries.
discovered: есть discoveredAt, нет researchedAt.
researched: есть researchedAt.
Источник точек:
Брать из map_points (есть), фильтровать по фазе/привязкам (есть в mappoint_bindings и механиках видимости).
Бэкенд (Convex)

Новый модуль exploration.ts:
commitTrace(args): { deviceId, userId?, zoneKey?, trace: Array<{lat,lng,t}> | {geohashSet: string[]}, bbox?: {minLat,maxLat,minLng,maxLng} }
Сервер: достаёт точки в зоне (по zoneKey/geohash/bbox), проверяет близость к пути (радиус ~20–30м), записывает point_discoveries.discoveredAt (идемпотентно), возвращает:
discoveredPoints: Array<{ key, title, coordinates, ... }>
zonePoints: Array<{ ... }> — все активные точки зоны (для подсветки).
TTL и версия для кэша (совместимо с serverVisiblePoints).
markResearched(args): { deviceId, userId?, pointKey }
Сервер: проставляет researchedAt (идемпотентно), может вернуть награду/флаги (по правилам).
Актуализация видимости:
Либо вернуть visiblePoints прямо из commitTrace (удобно — единый ответ), либо расширить mapPoints.listVisible и использовать в ответе quests.commitScene (client/convex/quests.ts:1) — второй вариант сложнее по маршрутам вызовов.
Валидация:
Идемпотентность по (deviceId, pointKey).
Грубая проверка честности: точка должна быть внутри distanceToPath <= R ИЛИ минимум один семпл ≤ R (без тяжёлой геометрии).
Дев/Сидинг:
zones.seedDev (если нужны зоны), mapPoints.seed... уже есть (client/convex/mapPoints.ts:1).
Клиент

Трекинг (features/path-tracking):
useRouteRecorder: navigator.geolocation.watchPosition с:
enableHighAccuracy: false, maxAge: 5–10с, timeout: 10–15с.
Фильтр “шаг”: минимальный сдвиг ≈ 8–15м, скорость > 0.3 м/с, исключение одиночных шумов.
Компрессия: Douglas–Peucker до 5–10м, ограничение N точек/минуту.
Геофенсинг зоны:
Вариант 1: геохеш-ячейки (длина 7–8; ~150–38м) — вход в новую ячейку => “зона”.
Вариант 2: предопределённые круги/полигоны (конфиг shared/config/zones.ts).
Вариант 3: BBox активного экрана карты как зона (просто и дешево).
Флаш сегмента:
При смене зоны или раз в N минут: сформировать payload и отправить exploration.commitTrace. При оффлайне — outbox (client/src/shared/lib/outbox.ts:1), добавить type: 'trace'.
Применение ответа (features/zone-discovery):
Обновить useGameDataStore.setServerVisiblePoints(...) для визуальной подсветки на карте (client/src/app/ConvexProvider.tsx:1, client/src/widgets/MapWidget/model/useClientVisiblePoints.ts:1).
Обновить локальный стор статусов точек usePoiStatusStore (новый) и сохранить в localStorage для оффлайна.
Взаимодействие и “researched” (features/poi-inspection):
При клике на маркер/сканировании QR: вызывать markResearched (и в outbox при оффлайне). Интегрировать в логику клика (useMarkers, client/src/widgets/MapWidget/model/useMarkers.tsx:1) и в QR (client/src/shared/api/qr/convex.ts:1).
Телефон (features/phone-points):
UI-список: фильтры по статусу/типу/дистанции; действия для “исследовать”.
Подсветка на карте: MapWidget может менять стиль для discovered/researched (client/src/widgets/MapWidget/MapWidget.tsx:1).
Контракт API:
shared/api/exploration/convex.ts: commitTrace, markResearched, тонкая интеграция с deviceId (client/src/shared/lib/deviceId.ts:1) и convexClient.
Состояния и интеграция с текущими механиками

Видимость:
Серверный ответ (visiblePoints + ttlMs) уже учитывается в useClientVisiblePoints через serverVisiblePoints (client/src/widgets/MapWidget/model/useClientVisiblePoints.ts:1). Просто подайте ttlMs и список точек из commitTrace.
Статусы:
Расширить типы entities/map-point (client/src/entities/map-point/model/types.ts:1) полем status: 'not_found'|'discovered'|'researched', isDiscovered оставить как derive (status !== 'not_found') для обратной совместимости с UI (MapPointTooltip, useMarkers).
Квесты:
Опционально можно начислять флаги/очки при researched (через markResearched → обновление player_state), механика уже есть в commitScene (client/convex/quests.ts:1), можно повторить паттерн.
Основные сложности

Гео-точность и шум:
Нужны фильтры по скорости/HDOP (проксируем через coords.accuracy), “липкость зоны” (находиться ≥ X секунд).
Производительность/батарея:
Уменьшать частоту, компрессия трека, отправка батчами, отключаемый режим “Исследование”.
Объём данных:
Ограничивать длину сегмента и глубину истории, отправлять только ячейки/огибающий bbox.
Оффлайн/консистентность:
Идемпотентность на сервере, opSeq/de-dup для outbox, TTL для serverVisiblePoints.
Безопасность:
Сервер не доверяет “самопометке discovered”: проверка близости к пути и валидность зоны.
UX:
Избежать “засвета” всех точек зоны сразу: возвращать только точки “по пути + ближайшие в зоне” (или лимит по приоритету/дистанции).
Варианты реализации “зоны”

Геохеш-ячейки:
Простой и быстрый (зона = текущая ячейка N символов). Отлично подходит для батчинга и идемпотентности (ключ зоны = geohash).
Предопределённые круги/полигоны:
Точная авторская география (центры/радиусы/полигоны). Требует таблицы zones и вычислений попадания в многоугольник.
Экранная зона:
Зона = текущий bbox видимой карты. Очень простой MVP, но завязан на UI.
Пошаговый план (MVP → расширение)

Схема Convex:
Добавить point_discoveries.
(Опц.) Добавить zones.
Бэкенд:
exploration.commitTrace и exploration.markResearched.
В ответ commitTrace возвращать visiblePoints + ttlMs и discoveredPoints.
Клиент: запись трека
features/path-tracking: useRouteRecorder, компрессия, смена зоны (геохеш v1).
Флаш в outbox при оффлайне.
Клиент: синхронизация
shared/api/exploration/convex.ts и интеграция с useGameDataStore.setServerVisiblePoints(...) (client/src/app/ConvexProvider.tsx:1).
poiStatusStore для статусов.
UI телефона
Список точек в зоне/по пути, статусы, переход к взаимодействию.
На карте: визуальное различие discovered/researched (client/src/widgets/MapWidget/model/useMarkers.tsx:1).
Расширения
Полигональные зоны, более строгая проверка близости к точке, интеграция с наградами/флагами.
Тестирование

Юнит: геоутилиты (расстояние до сегмента, компрессия).
Интеграция: отправка трека → возврат точек → обновление сторов → отрисовка.
E2E (ручное): смена зоны, оффлайн-режим с outbox, клик/QR → researched.
Что использовать из кода сейчас

Кэш видимых точек: serverVisiblePoints и TTL (client/src/app/ConvexProvider.tsx:1, client/src/widgets/MapWidget/model/useClientVisiblePoints.ts:1).
Отрисовка точек и взаимодействия: useMarkers (client/src/widgets/MapWidget/model/useMarkers.tsx:1).
Outbox для оффлайна: client/src/shared/lib/outbox.ts:1.
Convex-клиент: client/src/shared/lib/convexClient.ts:1.
Сидинг/привязки точек и квестов: client/convex/mapPoints.ts:1.
Инициализация сессии/прогресса: client/convex/quests.ts:1.
Нужна помощь детализировать контракты exploration.commitTrace/markResearched и схему point_discoveries под ваш стиль Convex? Могу расписать точные типы и скелеты функций.