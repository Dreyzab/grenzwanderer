import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { HomePage } from '../../pages/HomePage'
import { InventoryPage } from '../../pages/InventoryPage/InventoryPage'
import { QRScannerPage } from '../../pages/QRScannerPage/QRScannerPage'
import { OfflinePage } from '../../pages/OfflinePage/OfflinePage'
import { WorldEventsPage } from '../../pages/WorldEventsPage/WorldEventsPage'
import { MultiplayerPage } from '../../pages/MultiplayerPage/MultiplayerPage'
import { ContentPage } from '../../pages/ContentPage/ContentPage'

export function AppRouter() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400">Загрузка...</div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/qr-scanner" element={<QRScannerPage />} />
      <Route path="/map" element={<div>Map (Coming Soon)</div>} />
      <Route path="/quests" element={<div>Quests (Coming Soon)</div>} />
      <Route path="/combat" element={<div>Combat (Coming Soon)</div>} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/offline" element={<OfflinePage />} />
      <Route path="/events" element={<WorldEventsPage />} />
      <Route path="/multiplayer" element={<MultiplayerPage />} />
      <Route path="/content" element={<ContentPage />} />
      <Route path="/settings" element={<div>Settings (Coming Soon)</div>} />
    </Routes>
  )
}
