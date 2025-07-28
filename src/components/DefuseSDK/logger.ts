/**
 * This should be a separate file, so SDK logging could be set up without loading all other modules
 */

export type Context = Record<string, unknown>
export type Contexts = Record<
  string,
  Context | string | number | boolean | null | undefined
>

export interface ILogger {
  /**
   * Use verbose for detailed execution flow tracking
   * Example: verbose('Preparing transaction', { amount: 100 })
   */
  verbose: (message: string, data?: Record<string, unknown>) => void

  debug: (message: string, context?: Contexts) => void
  /**
   * Use info for significant operations
   * Example: info('Transaction sent successfully')
   */
  info: (message: string, context?: Contexts) => void
  warn: (message: string, context?: Contexts) => void
  error: (message: string | Error | unknown, context?: Contexts) => void
}

const noopLogger: ILogger = {
  verbose: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
}

export let logger: ILogger = { ...noopLogger }

export function setLogger(newLogger: ILogger) {
  logger = newLogger
}
