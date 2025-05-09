import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Фоллбэк для ленивой загрузки
const LazyLoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen bg-background">
    <div className="text-accent">Загрузка...</div>
  </div>
);

// Обертка для ленивой загрузки страниц
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<LazyLoadingFallback />}>
    <Component />
  </Suspense>
);

// Ленивая загрузка страниц из index.ts
const { 
  MainPage,
  GamePage,
  InventoryPage,
  QuestLogPage,
  ProfilePage,
  SettingsPage,
  CharacterStatsPage,
  LoginPage,
  RegisterPage,
  NotFoundPage,
  AdminPage,
  VisualNovelPage,
  SocialPage,
  BattlePage,
  MapPage
} = {
  MainPage: lazy(() => import('@/pages').then(module => ({ default: module.MainPage }))),
  GamePage: lazy(() => import('@/pages').then(module => ({ default: module.GamePage }))),
  InventoryPage: lazy(() => import('@/pages').then(module => ({ default: module.InventoryPage }))),
  QuestLogPage: lazy(() => import('@/pages').then(module => ({ default: module.QuestLogPage }))),
  ProfilePage: lazy(() => import('@/pages').then(module => ({ default: module.ProfilePage }))),
  SettingsPage: lazy(() => import('@/pages').then(module => ({ default: module.SettingsPage }))),
  CharacterStatsPage: lazy(() => import('@/pages').then(module => ({ default: module.CharacterStatsPage }))),
  LoginPage: lazy(() => import('@/pages').then(module => ({ default: module.LoginPage }))),
  RegisterPage: lazy(() => import('@/pages').then(module => ({ default: module.RegisterPage }))),
  NotFoundPage: lazy(() => import('@/pages').then(module => ({ default: module.NotFoundPage }))),
  AdminPage: lazy(() => import('@/pages').then(module => ({ default: module.AdminPage }))),
  VisualNovelPage: lazy(() => import('@/pages').then(module => ({ default: module.VisualNovelPage }))),
  SocialPage: lazy(() => import('@/pages').then(module => ({ default: module.SocialPage }))),
  BattlePage: lazy(() => import('@/pages').then(module => ({ default: module.BattlePage }))),
  MapPage: lazy(() => import('@/pages').then(module => ({ default: module.MapPage })))
};

// Определение маршрутов
export const router = createBrowserRouter([
  {
    path: '/',
    element: withSuspense(MainPage),
  },
  {
    path: '/game',
    element: withSuspense(GamePage),
  },
  {
    path: '/inventory',
    element: withSuspense(InventoryPage),
  },
  {
    path: '/quests',
    element: withSuspense(QuestLogPage),
  },
  {
    path: '/profile',
    element: withSuspense(ProfilePage),
  },
  {
    path: '/settings',
    element: withSuspense(SettingsPage),
  },
  {
    path: '/character',
    element: withSuspense(CharacterStatsPage),
  },
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    path: '/register',
    element: withSuspense(RegisterPage),
  },
  {
    path: '/admin',
    element: withSuspense(AdminPage),
  },
  {
    path: '/novel',
    element: withSuspense(VisualNovelPage),
  },
  {
    path: '/social',
    element: withSuspense(SocialPage),
  },
  {
    path: '/battle',
    element: withSuspense(BattlePage),
  },
  {
    path: '/map',
    element: withSuspense(MapPage),
  },
  {
    path: '*',
    element: withSuspense(NotFoundPage),
  },
]); 