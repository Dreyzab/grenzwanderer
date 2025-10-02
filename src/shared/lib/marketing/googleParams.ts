export type GoogleParams = {
  gclid?: string
  gbraid?: string
  wbraid?: string
  gclsrc?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  referrer?: string
}

export function parseGoogleParamsFromUrl(urlSearch: string): GoogleParams {
  const params = new URLSearchParams(urlSearch)
  const result: GoogleParams = {}

  const keys: (keyof GoogleParams)[] = [
    'gclid',
    'gbraid',
    'wbraid',
    'gclsrc',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
  ]

  keys.forEach((k) => {
    const v = params.get(k as string)
    if (v) (result as any)[k] = v
  })

  if (typeof document !== 'undefined' && document.referrer) {
    result.referrer = document.referrer
  }

  return result
}

export function storeGoogleParams(key: string, data: GoogleParams) {
  try {
    const payload = { ...data, storedAt: Date.now() }
    localStorage.setItem(key, JSON.stringify(payload))
  } catch {}
}

export function readStoredGoogleParams(key: string): GoogleParams | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed ?? null
  } catch {
    return null
  }
}

