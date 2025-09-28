import type { LucideIcon } from 'lucide-react'
import {
  Award,
  BookOpen,
  CalendarCheck,
  Map,
  Package,
  QrCode,
  ScrollText,
  Settings,
  ShieldCheck,
  Sword,
  Users
} from 'lucide-react'

export interface QuickAction {
  id: string
  title: string
  description: string
  icon: LucideIcon
  color: string
  bgColor: string
  borderColor: string
  href: string
  requiresAuth?: boolean
}

export const quickActions: QuickAction[] = [
  {
    id: 'qr',
    title: 'QR Scanner',
    description: 'Сканируйте коды в офлайн-зонах',
    icon: QrCode,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/30',
    borderColor: 'border-emerald-700/50',
    href: '/qr-scanner'
  },
  {
    id: 'map',
    title: 'Карта мира',
    description: 'Отслеживайте открытые зоны',
    icon: Map,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-700/50',
    href: '/map'
  },
  {
    id: 'quests',
    title: 'Активные квесты',
    description: 'Проверьте прогресс задач',
    icon: ScrollText,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-700/50',
    href: '/quests'
  },
  {
    id: 'combat',
    title: 'Карточный бой',
    description: 'Опробуйте боевые сценарии',
    icon: Sword,
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-700/50',
    href: '/combat',
    requiresAuth: true
  },
  {
    id: 'inventory',
    title: 'Инвентарь',
    description: 'Управляйте экипировкой',
    icon: Package,
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/30',
    borderColor: 'border-amber-700/50',
    href: '/inventory',
    requiresAuth: true
  },
  {
    id: 'clan',
    title: 'Отряды',
    description: 'Создайте группу исследователей',
    icon: Users,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-900/30',
    borderColor: 'border-zinc-700/50',
    href: '/multiplayer',
    requiresAuth: true
  },
  {
    id: 'lore',
    title: 'Архив знаний',
    description: 'Изучите хроники Границы',
    icon: BookOpen,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-700/50',
    href: '/content'
  },
  {
    id: 'events',
    title: 'События',
    description: 'Следите за активности мира',
    icon: CalendarCheck,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-700/50',
    href: '/world-events'
  }
]

export interface NewsItem {
  id: string
  title: string
  description: string
  icon: LucideIcon
  tag: string
}

export const newsFeed: NewsItem[] = [
  {
    id: 'story_update',
    title: 'Ветка «Фрайбург» расширена',
    description: 'Доступен новый эпизод визуальной новеллы и сет квестов',
    icon: ShieldCheck,
    tag: 'Сюжет'
  },
  {
    id: 'combat_patch',
    title: 'Баланс карточного боя',
    description: 'Пересмотрены эффекты артефактов и добавлены новые карты',
    icon: Sword,
    tag: 'Игровые системы'
  },
  {
    id: 'season_event',
    title: 'Старт сезонного события «Рекогносцировка»',
    description: 'Откройте аномалии и делитесь маршрутами с отрядом',
    icon: Award,
    tag: 'События'
  }
]

