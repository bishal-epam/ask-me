import pino from 'pino'

// pino-pretty uses thread-stream (worker threads) which crashes under Next.js
// Turbopack because the worker can't resolve node_modules from Turbopack's
// virtual FS. Plain pino writes JSON to stdout — works everywhere.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  base: {
    env: process.env.NODE_ENV,
    service: 'ask-me',
  },
})

export function getLogger(context: string) {
  return logger.child({ context })
}
