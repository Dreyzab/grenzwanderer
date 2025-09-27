import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { Button } from '../../shared/ui/components/Button'
import {
  Home,
  QrCode,
  Map,
  ScrollText,
  Sword,
  Package,
  Settings,
  User,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Главная', href: '/', icon: Home },
  { name: 'QR Scanner', href: '/qr-scanner', icon: QrCode },
  { name: 'Карта', href: '/map', icon: Map },
  { name: 'Квесты', href: '/quests', icon: ScrollText },
  { name: 'Бой', href: '/combat', icon: Sword },
  { name: 'Инвентарь', href: '/inventory', icon: Package },
  { name: 'Настройки', href: '/settings', icon: Settings },
]

export function Navbar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-zinc-100">Grenzwanderer</h1>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-emerald-400 border-b-2 border-emerald-400'
                        : 'text-zinc-300 hover:text-zinc-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center">
            <div className="hidden sm:flex sm:items-center sm:ml-6">
              <div className="flex items-center space-x-4">
                <span className="text-zinc-300 text-sm">
                  {user?.firstName || 'Игрок'}
                </span>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  Выйти
                </Button>
              </div>
            </div>
            <div className="sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div
          className="sm:hidden"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="pt-2 pb-3 space-y-1 bg-zinc-800">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block pl-3 pr-4 py-2 text-base font-medium transition-colors ${
                    isActive
                      ? 'text-emerald-400 bg-zinc-700'
                      : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4 mr-3 inline" />
                  {item.name}
                </Link>
              )
            })}
            <div className="border-t border-zinc-600 pt-4">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-zinc-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-zinc-300" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-zinc-100">
                    {user?.firstName || 'Игрок'}
                  </div>
                  <div className="text-sm font-medium text-zinc-400">
                    {user?.primaryEmailAddress?.emailAddress}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => signOut()}
                >
                  Выйти
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  )
}
