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
  NotFoundPage
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
    path: '/novel',
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
    path: '*',
    element: <NotFoundPage />
  }
]; 