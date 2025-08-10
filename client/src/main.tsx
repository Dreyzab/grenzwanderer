import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import MainLayout from '@/app/layouts/MainLayout'
import FullScreenLayout from '@/app/layouts/FullScreenLayout'
import { AppConvexProvider, QuestHydrator } from '@/app/ConvexProvider'
import './App.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    Component: MainLayout,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./pages/HomePage')).Component }) },
      { path: 'quests', lazy: async () => ({ Component: (await import('./pages/QuestsPage')).Component }) },
      { path: 'map', lazy: async () => ({ Component: (await import('./pages/MapPage')).Component }) },
      { path: 'settings', lazy: async () => ({ Component: (await import('./pages/SettingsPage')).Component }) },
    ],
  },
  {
    path: '/novel',
    Component: FullScreenLayout,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./pages/NovelPage')).Component }) },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppConvexProvider>
      <QuestHydrator>
        <RouterProvider router={router as any} />
      </QuestHydrator>
    </AppConvexProvider>
  </StrictMode>,
)
