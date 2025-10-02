import { useCallback, useMemo } from 'react'
import logger from '@/shared/lib/logger'

/**
 * Hook that provides a logger scoped to a component name.
 * Returns a stable object so effects using it don't re-run unnecessarily.
 */
export const useLogger = (componentName?: string) => {
  const createContextLogger = useCallback((method: keyof typeof logger) => {
    return (...args: any[]) => {
      const context = componentName ? `[${componentName}]` : ''
      ;(logger[method] as (...args: any[]) => void)(context, ...args)
    }
  }, [componentName])

  return useMemo(() => ({
    info: createContextLogger('info'),
    warn: createContextLogger('warn'),
    error: createContextLogger('error'),
    env: logger.env,
    object: logger.object,
    array: logger.array,
    api: logger.api,
    state: logger.state,
    perf: logger.perf,
    logger,
  }), [createContextLogger])
}

export default useLogger
