export type LogCategory = 'MAP' | 'QUEST' | 'DIALOG' | 'SEED' | 'STORE' | 'AUTH'

function time(): string {
  return new Date().toISOString()
}

function prefix(category: LogCategory): string[] {
  return [
    `[%c${category}%c][${time()}]`,
    'color:#86efac;font-weight:bold;',
    'color:inherit;font-weight:normal;',
  ]
}

export const logger = {
  debug(category: LogCategory, ...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.debug(...prefix(category), ...args)
  },
  info(category: LogCategory, ...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.info(...prefix(category), ...args)
  },
  warn(category: LogCategory, ...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.warn(...prefix(category), ...args)
  },
  error(category: LogCategory, ...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.error(...prefix(category), ...args)
  },
}

export default logger


