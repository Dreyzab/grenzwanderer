import { ConvexReactClient } from 'convex/react'
import logger from '@/shared/lib/logger'

const url = (import.meta as any)?.env?.VITE_CONVEX_URL as string | undefined

const resolvedUrl = url && url.length > 0 ? url : 'http://localhost:8187'

if (!url) {
  logger.warn('[Convex] VITE_CONVEX_URL не задан, использую http://localhost:8187')
}

export const convexClient = new ConvexReactClient(resolvedUrl)

export default convexClient


