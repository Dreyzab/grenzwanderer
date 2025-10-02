import { ConvexReactClient } from 'convex/react'
import logger from '@/shared/lib/logger'

// Injected at build time by Vite's `define`
declare const __VITE_CONVEX_URL__: string

function resolveConvexUrl(): string {
  const fromVite = (import.meta as any)?.env?.VITE_CONVEX_URL as string | undefined
  const fromDefine = (typeof __VITE_CONVEX_URL__ === 'string' ? __VITE_CONVEX_URL__ : '') as string | undefined
  const fromWindow = (typeof window !== 'undefined' ? (window as any)?.VITE_CONVEX_URL : undefined) as
    | string
    | undefined

  let value = (fromVite ?? fromDefine ?? fromWindow ?? '').trim()

  if (!value && (import.meta as any)?.env?.DEV) {
    // Safe dev fallback to local Convex
    value = 'http://127.0.0.1:3210'
    logger.warn('[Convex] VITE_CONVEX_URL missing, falling back to http://127.0.0.1:3210 (dev)')
  }

  if (!value) {
    // Do not crash the app; fall back to localhost and warn.
    value = 'http://127.0.0.1:3210'
    logger.error('[Convex] Missing VITE_CONVEX_URL. Falling back to http://127.0.0.1:3210')
    logger.error('Set VITE_CONVEX_URL=https://<deployment>.convex.cloud for cloud or run npx convex dev locally')
  }

  logger.info(`[Convex] Using base URL: ${value}`)
  return value
}

const CONVEX_BASE_URL = resolveConvexUrl()

export const convexClient = new ConvexReactClient(CONVEX_BASE_URL)

export default convexClient
