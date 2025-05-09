import React from 'react';
import { RouteObject } from 'react-router-dom';
import { 
  MainPage,
  GamePage,
  LoginPage,
  RegisterPage,
  ProfilePage,
  AdminPage,
  VisualNovelPage,
  QuestLogPage,
  InventoryPage,
  CharacterStatsPage,
  SocialPage,
  SettingsPage,
  NotFoundPage,
  BattlePage,
  MapPage
} from '@/pages';
import { PrivateRoute } from '@/widgets/auth/PrivateRoute';

// Для страниц, требующих аутентификации
const protectedPage = (Component: React.ComponentType) => {
  return {
    element: (
      <PrivateRoute>
        <Component />
      </PrivateRoute>
    )
  };
};

// Конфигурация маршрутов
export const routerConfig: RouteObject[] = [
  {
    path: '/',
    element: <MainPage />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/register',
    element: <RegisterPage />
  },
  {
    path: '/game',
    ...protectedPage(GamePage)
  },
  {
    path: '/profile',
    ...protectedPage(ProfilePage)
  },
  {
    path: '/admin',
    ...protectedPage(AdminPage)
  },
  {
    // Маршрут без параметров для инициализации через state
    path: '/novel',
    ...protectedPage(VisualNovelPage)
  },
  {
    // Параметризованный маршрут для прямой инициализации через URL
    path: '/novel/:sceneId',
    ...protectedPage(VisualNovelPage)
  },
  {
    path: '/quests',
    ...protectedPage(QuestLogPage)
  },
  {
    path: '/inventory',
    ...protectedPage(InventoryPage)
  },
  {
    path: '/character',
    ...protectedPage(CharacterStatsPage)
  },
  {
    path: '/social',
    ...protectedPage(SocialPage)
  },
  {
    path: '/settings',
    ...protectedPage(SettingsPage)
  },
  {
    path: '/battle',
    ...protectedPage(BattlePage)
  },
  {
    path: '/map',
    ...protectedPage(MapPage)
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]; 