import { ReactNode } from 'react'
import { ConvexProvider } from 'convex/react'
import convexClient from '@/shared/lib/convexClient/convexClient'

interface Props { children: ReactNode }

export function AppConvexProvider({ children }: Props) {
  return (
    <ConvexProvider client={convexClient}>
      {children}
    </ConvexProvider>
  )
}

export default AppConvexProvider


