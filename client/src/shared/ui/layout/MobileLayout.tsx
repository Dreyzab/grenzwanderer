import { ReactNode, useEffect, useState } from 'react'
import { cn } from '../../lib/utils/cn'

interface MobileLayoutProps {
  children: ReactNode
  className?: string
  header?: ReactNode
  footer?: ReactNode
  showSafeArea?: boolean
  backgroundGradient?: boolean
}

export function MobileLayout({
  children,
  className,
  header,
  footer,
  showSafeArea = true,
  backgroundGradient = true,
}: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })

  // Определение мобильного устройства и ориентации
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768
      const landscape = window.innerHeight < window.innerWidth

      setIsMobile(mobile)
      setIsLandscape(landscape)

      // Определение safe area insets для устройств с notch
      if (mobile && 'getComputedStyle' in window) {
        const testElement = document.createElement('div')
        testElement.style.cssText = `
          position: fixed;
          top: env(safe-area-inset-top);
          bottom: env(safe-area-inset-bottom);
          left: env(safe-area-inset-left);
          right: env(safe-area-inset-right);
          visibility: hidden;
        `
        document.body.appendChild(testElement)

        const computedStyle = getComputedStyle(testElement)
        setSafeAreaInsets({
          top: parseInt(computedStyle.top) || 0,
          bottom: parseInt(computedStyle.bottom) || 0,
          left: parseInt(computedStyle.left) || 0,
          right: parseInt(computedStyle.right) || 0,
        })

        document.body.removeChild(testElement)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [])

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col',
        backgroundGradient && 'bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900',
        className
      )}
      style={{
        paddingTop: showSafeArea && safeAreaInsets.top > 0 ? `${safeAreaInsets.top}px` : undefined,
        paddingBottom: showSafeArea && safeAreaInsets.bottom > 0 ? `${safeAreaInsets.bottom}px` : undefined,
        paddingLeft: showSafeArea && safeAreaInsets.left > 0 ? `${safeAreaInsets.left}px` : undefined,
        paddingRight: showSafeArea && safeAreaInsets.right > 0 ? `${safeAreaInsets.right}px` : undefined,
      }}
    >
      {/* Header */}
      {header && (
        <header className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-700">
          <div className="px-4 py-3">
            {header}
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className={cn(
          'w-full h-full',
          isMobile && 'px-4 py-2',
          isLandscape && 'max-w-none'
        )}>
          {children}
        </div>
      </main>

      {/* Footer */}
      {footer && (
        <footer className="sticky bottom-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-700">
          <div className="px-4 py-3">
            {footer}
          </div>
        </footer>
      )}

      {/* Mobile navigation hint */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 bg-zinc-800/90 backdrop-blur-sm rounded-full p-2 pointer-events-none">
          <div className="w-1 h-1 bg-zinc-400 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  )
}

/**
 * Mobile-optimized container
 */
export function MobileContainer({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode
  className?: string
  size?: 'sm' | 'default' | 'lg' | 'full'
}) {
  const sizeClasses = {
    sm: 'max-w-sm mx-auto',
    default: 'max-w-md mx-auto',
    lg: 'max-w-lg mx-auto',
    full: 'w-full',
  }

  return (
    <div className={cn(sizeClasses[size], className)}>
      {children}
    </div>
  )
}

/**
 * Mobile-optimized card
 */
export function MobileCard({
  children,
  className,
  variant = 'default',
  ...props
}: {
  children: ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined'
} & React.HTMLAttributes<HTMLDivElement>) {
  const variantClasses = {
    default: 'bg-zinc-800/50 border border-zinc-700',
    elevated: 'bg-zinc-800/80 border border-zinc-600 shadow-lg',
    outlined: 'bg-transparent border-2 border-zinc-600',
  }

  return (
    <div
      className={cn(
        'rounded-xl p-4 backdrop-blur-sm',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Mobile-optimized button
 */
export function MobileButton({
  children,
  className,
  size = 'md',
  variant = 'primary',
  ...props
}: {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'ghost'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizeClasses = {
    sm: 'h-10 px-3 text-sm',
    md: 'h-12 px-4 text-base',
    lg: 'h-14 px-6 text-lg',
  }

  const variantClasses = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    secondary: 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100',
    ghost: 'bg-transparent hover:bg-zinc-800 text-zinc-300',
  }

  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-colors active:scale-95',
        'min-h-[44px] min-w-[44px]', // Touch target size
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Mobile-optimized input
 */
export function MobileInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full h-12 px-4 rounded-lg bg-zinc-800 border border-zinc-600',
        'text-zinc-100 placeholder-zinc-400',
        'focus:border-emerald-500 focus:outline-none',
        'min-h-[44px]', // Touch target size
        className
      )}
      {...props}
    />
  )
}

/**
 * Mobile navigation bar
 */
export function MobileNavBar({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <nav className={cn(
      'flex items-center justify-around bg-zinc-900/95 backdrop-blur-sm',
      'border-t border-zinc-700 py-2 px-4',
      'safe-area-pb-2', // Safe area для устройств с home indicator
      className
    )}>
      {children}
    </nav>
  )
}

/**
 * Mobile navigation item
 */
export function MobileNavItem({
  icon,
  label,
  active = false,
  onClick,
  className,
}: {
  icon: ReactNode
  label: string
  active?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
        'min-w-[60px] min-h-[60px]', // Touch target size
        active
          ? 'bg-emerald-600/20 text-emerald-400'
          : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50',
        className
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}
