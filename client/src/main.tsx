import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import MainLayout from '@/app/layouts/MainLayout'
import FullScreenLayout from '@/app/layouts/FullScreenLayout'
import { AppConvexProvider, QuestHydrator } from '@/app/ConvexProvider'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { convexClient } from '@/shared/lib/convexClient'
import './App.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    Component: MainLayout,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./pages/HomePage')).Component }) },
      { path: 'quests', lazy: async () => ({ Component: (await import('./pages/QuestsPage')).Component }) },
      { path: 'map', lazy: async () => ({ Component: (await import('./pages/MapPage')).Component }) },
      { path: 'scan', lazy: async () => ({ Component: (await import('./pages/QRScanPage')).Component }) },
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

const clerkPublishableKey = (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {clerkPublishableKey ? (
      <ClerkProvider publishableKey={clerkPublishableKey} afterSignInUrl="/map?createCharacter=1" afterSignUpUrl="/map?createCharacter=1">
        <ConvexProviderWithClerk client={convexClient as any} useAuth={useAuth}>
          <QuestHydrator>
            <RouterProvider router={router as any} />
          </QuestHydrator>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    ) : (
      // Fallback на старый ConvexProvider если ключа нет (dev без Clerk)
      <AppConvexProvider>
        <QuestHydrator>
          <RouterProvider router={router as any} />
        </QuestHydrator>
      </AppConvexProvider>
    )}
  </StrictMode>,
)
