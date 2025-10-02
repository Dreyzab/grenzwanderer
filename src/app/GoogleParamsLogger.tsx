import { useEffect } from 'react'
import logger from '@/shared/lib/logger'
import { parseGoogleParamsFromUrl, storeGoogleParams, readStoredGoogleParams } from '@/shared/lib/marketing/googleParams'

const STORAGE_KEY = 'gw_google_params'

export default function GoogleParamsLogger() {
  useEffect(() => {
    try {
      const parsed = parseGoogleParamsFromUrl(window.location.search)

      const hasAny = Object.keys(parsed).some((k) => (parsed as any)[k] !== undefined)
      if (!hasAny) {
        const stored = readStoredGoogleParams(STORAGE_KEY)
        if (stored) {
          logger.object('[Google] Stored UTM/GCLID params', stored)
        } else {
          logger.info('[Google] No UTM/GCLID params found in URL or storage')
        }
        return
      }

      logger.object('[Google] UTM/GCLID params from URL', parsed)
      storeGoogleParams(STORAGE_KEY, parsed)
    } catch (e) {
      logger.error('[Google] Failed to parse/log params', e)
    }
  }, [])

  return null
}

