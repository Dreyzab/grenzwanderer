import type { ComponentType } from 'react'
import type { Doc } from '@/../convex/_generated/dataModel'

// Enhanced Dashboard Statistics с типизацией
export interface DashboardStats {
  completedQuests: number
  totalQuests: number
  currentPhase: number
  experienceGained: number
  daysSinceStart: number
  completionRate: number
  weeklyProgress: number
}

// Player Status для карточки статуса
export interface PlayerStatus {
  profile: Doc<'players'> | null
  isOnline: boolean
  lastSeen: Date | null
  currentLocation?: {
    lat: number
    lng: number
    name?: string
  }
}

// Quick Action с типизированными состояниями
export interface QuickAction {
  id: string
  icon: ComponentType<{ size?: number; className?: string }>
  label: string
  description: string
  path: string
  color: string
  bgColor: string
  borderColor: string
  badge?: number | string
  isEnabled: boolean
  requiredPhase?: number
}

// Quest для активного списка с расширенной информацией
export interface ActiveQuest {
  questId: string
  title: string
  description: string
  currentStep: string
  progress: number
  maxProgress: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedTime: number // в минутах
  rewards: QuestReward[]
  location?: {
    name: string
    distance: number // в метрах
  }
}

// Quest rewards типизация
export interface QuestReward {
  type: 'experience' | 'reputation' | 'item' | 'currency'
  amount: number
  itemId?: string
  reputationCategory?: string
}

// System Status для уведомлений
export interface SystemStatus {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  description: string
  timestamp: Date
  isRead: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

// News Item для системных новостей
export interface NewsItem {
  id: string
  title: string
  content: string
  type: 'update' | 'event' | 'maintenance' | 'feature'
  publishedAt: Date
  priority: number
  icon?: string
}

// Performance Metrics для оптимизации
export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage: number
  networkStatus: 'online' | 'offline' | 'slow'
  lastSync: Date | null
}

// Geolocation state
export interface GeolocationState {
  isEnabled: boolean
  isLoading: boolean
  position: {
    lat: number
    lng: number
    accuracy: number
  } | null
  error: string | null
  lastUpdate: Date | null
}

// Cache Status для PWA
export interface CacheStatus {
  isAvailable: boolean
  lastUpdate: Date | null
  size: number // в байтах
  version: string
  pendingUpdates: number
}
