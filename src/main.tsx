import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppConvexProvider from '@/app/ConvexProvider'
import HomePage from '@/pages/HomePage'
import './index.css'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppConvexProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </AppConvexProvider>
  </React.StrictMode>
)


