const logger = {
  info: (...args: any[]) => {
    try { console.info(...args) } catch {}
  },
  warn: (...args: any[]) => {
    try { console.warn(...args) } catch {}
  },
  error: (...args: any[]) => {
    try { console.error(...args) } catch {}
  }
}

export default logger


