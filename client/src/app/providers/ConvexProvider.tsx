import { ReactNode } from 'react'
import { ConvexProvider as BaseConvexProvider, ConvexReactClient } from 'convex/react'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL || 'http://localhost:3210')

interface ConvexProviderProps {
  children: ReactNode
}

export function ConvexProvider({ children }: ConvexProviderProps) {
  return (
    <BaseConvexProvider client={convex}>
      {children}
    </BaseConvexProvider>
  )
}
