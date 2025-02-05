import * as Sentry from "@sentry/core"

export type Context = Record<string, unknown>
export type Contexts = Record<string, Context | undefined>

export interface ILogger {
  /**
   * Use verbose for detailed execution flow tracking
   * Example: verbose('Preparing transaction', { amount: 100 })
   */
  verbose: (message: string, data?: Record<string, unknown>) => void

  /**
   * Use info for significant operations
   * Example: info('Transaction sent successfully')
   */
  info: (message: string, context?: Contexts) => void
  warn: (message: string, context?: Contexts) => void
  error: (message: string | Error | unknown, context?: Contexts) => void
}

const noopLogger: ILogger = {
  verbose: (msg, data) => {
    console.log(msg, data)
    Sentry.addBreadcrumb({
      message: msg,
      category: "defuse-sdk",
      data: data,
    })
  },
  info: (msg, contexts) => {
    console.log(msg, contexts)
    Sentry.captureMessage(msg, { contexts, level: "info" })
  },
  warn: (msg, contexts) => {
    console.warn(msg, contexts)
    Sentry.captureMessage(msg, { contexts, level: "warning" })
  },
  error: (err, contexts) => {
    console.error(err, contexts)
    Sentry.captureException(err, { contexts })
  },
}

export let logger: ILogger = { ...noopLogger }

export function setLogger(newLogger: ILogger) {
  logger = newLogger
}
