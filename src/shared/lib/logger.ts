type Any = any

const logger = {
  info: (...args: Any[]) => {
    try { console.info('[INFO]', ...args) } catch {}
  },
  warn: (...args: Any[]) => {
    try { console.warn('[WARN]', ...args) } catch {}
  },
  error: (...args: Any[]) => {
    try { console.error('[ERROR]', ...args) } catch {}
  },
  debug: (...args: Any[]) => {
    try {
      if (typeof console.debug === 'function') console.debug('[DEBUG]', ...args)
      else console.log('[DEBUG]', ...args)
    } catch {}
  },

  env: (key: string, value: Any, required: boolean = false) => {
    try {
      const present = value !== undefined && value !== null && value !== ''
      console.log('[ENV]', key, '=', present ? value : 'undefined')
      if (required && !present) {
        console.error(`[ENV] Missing required variable: ${key}`)
      }
    } catch {}
  },

  object: (label: string, obj: Any) => {
    try {
      console.group(`[OBJ] ${label}`)
      console.log(obj)
      console.groupEnd()
    } catch {}
  },

  array: (label: string, arr: Any[]) => {
    try {
      console.group(`[ARR] ${label} (${arr.length})`)
      arr.forEach((item, index) => console.log(`[${index}]`, item))
      console.groupEnd()
    } catch {}
  },

  api: (method: string, url: string, data?: Any) => {
    try {
      console.group(`[API] ${method.toUpperCase()} ${url}`)
      if (data) console.log('payload:', data)
      console.groupEnd()
    } catch {}
  },

  state: (storeName: string, state: Any) => {
    try {
      console.group(`[STATE] ${storeName}`)
      console.log(state)
      console.groupEnd()
    } catch {}
  },

  perf: (label: string, startTime: number) => {
    try { console.log(`[PERF] ${label}: ${Date.now() - startTime}ms`) } catch {}
  },
}

export default logger

