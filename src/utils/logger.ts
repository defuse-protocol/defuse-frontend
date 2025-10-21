export type Context = Record<string, unknown>

export interface ILogger {
  trace: (message: string, context?: Context) => void
  info: (message: string, context?: Context) => void
  warn: (message: string, context?: Context) => void
  error: (message: string | Error | unknown, context?: Context) => void
}

export const logger: ILogger = console
