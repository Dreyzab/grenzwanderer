import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/app/auth'
import AppConvexProvider from '@/app/ConvexProvider'
import ModernHomePage from '@/pages/ModernHomePage'
import { MapPage } from '@/pages/MapPage'
import { SettingsPage } from '@/pages/SettingsPage'
import GoogleParamsLogger from '@/app/GoogleParamsLogger'
import logger from '@/shared/lib/logger'
import './index.css'
import './App.css'

// Local auth mode (Clerk disabled)
logger.info('[Auth] Using local admin auth')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppConvexProvider>
        <GoogleParamsLogger />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ModernHomePage />} />
            <Route path="/enhanced-map" element={<MapPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </BrowserRouter>
      </AppConvexProvider>
    </AuthProvider>
  </React.StrictMode>
)
