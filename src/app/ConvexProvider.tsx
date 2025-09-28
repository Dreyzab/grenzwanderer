import { ReactNode } from 'react'
import { ConvexProvider } from 'convex/react'
import { QueryProvider } from './providers/QueryProvider'
import convexClient from '@/shared/lib/convexClient/convexClient'

interface Props { children: ReactNode }

export function AppConvexProvider({ children }: Props) {
  return (
    <ConvexProvider client={convexClient}>
      <QueryProvider>
        {children}
      </QueryProvider>
    </ConvexProvider>
  )
}

export default AppConvexProvider


