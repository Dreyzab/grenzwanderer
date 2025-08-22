import { Link, useLocation } from 'react-router-dom'
import { SignInButton, UserButton, useAuth } from '@clerk/clerk-react'

const tabs = [
  { to: '/', label: 'Главная' },
  { to: '/quests', label: 'Квесты' },
  { to: '/map', label: 'Карта' },
  { to: '/settings', label: 'Настройки' },
]

export function Navbar() {
  const location = useLocation()
  const { isSignedIn } = useAuth()
  return (
    <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur border-b border-neutral-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
        <div className="font-semibold">QR-Boost</div>
        <nav className="flex gap-1">
          {tabs.map((t) => {
            const active = location.pathname === t.to
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  active ? 'bg-neutral-800 text-white' : 'text-neutral-300 hover:bg-neutral-800/60'
                }`}
              >
                {t.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <button className="bg-neutral-800 hover:bg-neutral-700 rounded px-3 py-1.5 text-sm">Войти</button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar


