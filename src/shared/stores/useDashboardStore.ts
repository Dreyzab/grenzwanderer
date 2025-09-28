import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { GeolocationState, CacheStatus, PerformanceMetrics } from '@/shared/types/dashboard'

// Local Dashboard State (client-side only)
interface DashboardState {
  // UI State
  ui: {
    sidebarCollapsed: boolean
    activeSection: string
    theme: 'dark' | 'light' | 'auto'
    animations: boolean
    notifications: boolean
  }
  
  // Geolocation State
  geolocation: GeolocationState
  
  // Cache State для PWA
  cache: CacheStatus
  
  // Performance Metrics
  performance: PerformanceMetrics
  
  // Preferences (localStorage persistent)
  preferences: {
    autoRefresh: boolean
    refreshInterval: number // в секундах
    soundEnabled: boolean
    vibrationEnabled: boolean
    compactMode: boolean
    showTutorials: boolean
    language: 'en' | 'de' | 'ru'
  }
  
  // Session Data (sessionStorage)
  session: {
    startTime: Date
    pageViews: number
    interactionCount: number
    lastActivity: Date
  }
  
  // Temporary State (memory only)
  temp: {
    pendingNotifications: string[]
    draggedItem: string | null
    modalStack: string[]
    loadingStates: Record<string, boolean>
  }
}

// Actions interface
interface DashboardActions {
  // UI Actions
  toggleSidebar: () => void
  setActiveSection: (section: string) => void
  setTheme: (theme: 'dark' | 'light' | 'auto') => void
  
  // Geolocation Actions
  updateGeolocation: (position: { lat: number; lng: number; accuracy: number }) => void
  setGeolocationError: (error: string | null) => void
  setGeolocationLoading: (loading: boolean) => void
  
  // Cache Actions
  updateCacheStatus: (status: Partial<CacheStatus>) => void
  
  // Performance Actions
  recordPerformanceMetric: (metric: Partial<PerformanceMetrics>) => void
  
  // Preferences Actions
  updatePreferences: (preferences: Partial<DashboardState['preferences']>) => void
  
  // Session Actions
  recordInteraction: () => void
  recordPageView: () => void
  
  // Temp Actions
  addNotification: (id: string) => void
  removeNotification: (id: string) => void
  setDraggedItem: (item: string | null) => void
  pushModal: (modal: string) => void
  popModal: () => void
  setLoading: (key: string, loading: boolean) => void
  
  // Utility Actions
  reset: () => void
  clearSession: () => void
}

type DashboardStore = DashboardState & DashboardActions

// Initial state
const initialState: DashboardState = {
  ui: {
    sidebarCollapsed: false,
    activeSection: 'dashboard',
    theme: 'dark',
    animations: true,
    notifications: true,
  },
  geolocation: {
    isEnabled: false,
    isLoading: false,
    position: null,
    error: null,
    lastUpdate: null,
  },
  cache: {
    isAvailable: false,
    lastUpdate: null,
    size: 0,
    version: '1.0.0',
    pendingUpdates: 0,
  },
  performance: {
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkStatus: 'online',
    lastSync: null,
  },
  preferences: {
    autoRefresh: true,
    refreshInterval: 30,
    soundEnabled: true,
    vibrationEnabled: true,
    compactMode: false,
    showTutorials: true,
    language: 'ru',
  },
  session: {
    startTime: new Date(),
    pageViews: 0,
    interactionCount: 0,
    lastActivity: new Date(),
  },
  temp: {
    pendingNotifications: [],
    draggedItem: null,
    modalStack: [],
    loadingStates: {},
  },
}

// Store implementation с persist для preferences
export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // UI Actions
      toggleSidebar: () =>
        set((state) => ({
          ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed },
        })),
      
      setActiveSection: (section: string) =>
        set((state) => ({
          ui: { ...state.ui, activeSection: section },
        })),
      
      setTheme: (theme: 'dark' | 'light' | 'auto') =>
        set((state) => ({
          ui: { ...state.ui, theme },
        })),
      
      // Geolocation Actions
      updateGeolocation: (position) =>
        set((state) => ({
          geolocation: {
            ...state.geolocation,
            position,
            lastUpdate: new Date(),
            error: null,
            isLoading: false,
          },
        })),
      
      setGeolocationError: (error) =>
        set((state) => ({
          geolocation: { ...state.geolocation, error, isLoading: false },
        })),
      
      setGeolocationLoading: (isLoading) =>
        set((state) => ({
          geolocation: { ...state.geolocation, isLoading },
        })),
      
      // Cache Actions
      updateCacheStatus: (status) =>
        set((state) => ({
          cache: { ...state.cache, ...status },
        })),
      
      // Performance Actions
      recordPerformanceMetric: (metric) =>
        set((state) => ({
          performance: { ...state.performance, ...metric },
        })),
      
      // Preferences Actions
      updatePreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),
      
      // Session Actions
      recordInteraction: () =>
        set((state) => ({
          session: {
            ...state.session,
            interactionCount: state.session.interactionCount + 1,
            lastActivity: new Date(),
          },
        })),
      
      recordPageView: () =>
        set((state) => ({
          session: {
            ...state.session,
            pageViews: state.session.pageViews + 1,
            lastActivity: new Date(),
          },
        })),
      
      // Temp Actions
      addNotification: (id) =>
        set((state) => ({
          temp: {
            ...state.temp,
            pendingNotifications: [...state.temp.pendingNotifications, id],
          },
        })),
      
      removeNotification: (id) =>
        set((state) => ({
          temp: {
            ...state.temp,
            pendingNotifications: state.temp.pendingNotifications.filter(notifId => notifId !== id),
          },
        })),
      
      setDraggedItem: (item) =>
        set((state) => ({
          temp: { ...state.temp, draggedItem: item },
        })),
      
      pushModal: (modal) =>
        set((state) => ({
          temp: {
            ...state.temp,
            modalStack: [...state.temp.modalStack, modal],
          },
        })),
      
      popModal: () =>
        set((state) => ({
          temp: {
            ...state.temp,
            modalStack: state.temp.modalStack.slice(0, -1),
          },
        })),
      
      setLoading: (key, loading) =>
        set((state) => ({
          temp: {
            ...state.temp,
            loadingStates: { ...state.temp.loadingStates, [key]: loading },
          },
        })),
      
      // Utility Actions
      reset: () => set(initialState),
      
      clearSession: () =>
        set((state) => ({
          session: { ...initialState.session, startTime: new Date() },
          temp: initialState.temp,
        })),
    }),
    {
      name: 'dashboard-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage
        }

        return {
          getItem: () => null,
          setItem: () => undefined,
          removeItem: () => undefined,
        }
      }),
      // Persist только preferences и некоторые UI настройки
      partialize: (state) => ({
        ui: {
          theme: state.ui.theme,
          animations: state.ui.animations,
          notifications: state.ui.notifications,
        },
        preferences: state.preferences,
      }),
    }
  )
)
