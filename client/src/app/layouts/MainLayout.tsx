import { ReactNode } from 'react'
import { Navbar } from '../../widgets/Navbar/Navbar'
import { PWAInstallPrompt } from '../../widgets/PWAInstallPrompt/PWAInstallPrompt'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <Navbar />
      <main className="pb-16">
        {children}
      </main>
      <PWAInstallPrompt variant="banner" position="bottom" />
    </div>
  )
}
