import { ConvexReactClient } from 'convex/react'

const convexUrl = (import.meta as any).env.VITE_CONVEX_URL as string

if (!convexUrl) {
  // eslint-disable-next-line no-console
  console.warn('VITE_CONVEX_URL is not set. Convex client will fail to connect.')
}

export const convexClient = new ConvexReactClient(convexUrl)


