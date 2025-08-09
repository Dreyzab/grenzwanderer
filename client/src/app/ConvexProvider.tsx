import type { ReactNode } from 'react'
import { ConvexProvider } from 'convex/react'
import { convexClient } from '@/shared/lib/convexClient'

type Props = { children: ReactNode }

export function AppConvexProvider({ children }: Props) {
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>
}


