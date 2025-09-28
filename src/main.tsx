import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import AppConvexProvider from '@/app/ConvexProvider'
import ModernHomePage from '@/pages/ModernHomePage'
import './index.css'
import './App.css'

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AppConvexProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ModernHomePage />} />
          </Routes>
        </BrowserRouter>
      </AppConvexProvider>
    </ClerkProvider>
  </React.StrictMode>
)


