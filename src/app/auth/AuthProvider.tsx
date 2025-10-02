import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type AuthContextValue = {
  isSignedIn: boolean
  isAdmin: boolean
  userId: string | null
  registerAdmin: (name?: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'gw_auth'

function genId() {
  return `admin-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed?.userId && parsed?.role === 'admin') {
        setUserId(parsed.userId)
        setIsAdmin(true)
      }
    } catch {}
  }, [])

  const registerAdmin = useCallback((name?: string) => {
    const id = genId()
    const record = { userId: id, role: 'admin', name: name || 'Admin', createdAt: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
    setUserId(id)
    setIsAdmin(true)
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUserId(null)
    setIsAdmin(false)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    isSignedIn: Boolean(userId),
    isAdmin,
    userId,
    registerAdmin,
    signOut,
  }), [userId, isAdmin, registerAdmin, signOut])

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

