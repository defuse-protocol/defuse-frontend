// src/shims/pino.ts

type PinoLevel =
  | "fatal"
  | "error"
  | "warn"
  | "info"
  | "debug"
  | "trace"
  | "silent"

export interface PinoLogger {
  level: PinoLevel
  fatal: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  trace: (...args: unknown[]) => void
  child: (_bindings?: Record<string, unknown>) => PinoLogger
}

// This mimics the shape of pino.levels that @walletconnect/logger uses:
// - levels.values.<level> -> number
// - (optionally) levels.labels[number] -> level
export const levels = {
  labels: {
    10: "trace",
    20: "debug",
    30: "info",
    40: "warn",
    50: "error",
    60: "fatal",
  } as Record<number, PinoLevel>,
  values: {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
  } as Record<Exclude<PinoLevel, "silent">, number>,
} as const

export interface PinoOptions {
  level?: PinoLevel
  // add more if something complains at runtime
}

function createConsoleMethod(fallback: (...args: unknown[]) => void) {
  function logMethod(...args: unknown[]): void {
    fallback(...args)
  }

  return logMethod
}

export default function pino(
  _options?: PinoOptions,
  _destination?: unknown
): PinoLogger {
  const level: PinoLevel = _options?.level ?? "info"

  const logger: PinoLogger = {
    level,
    fatal: createConsoleMethod(console.error),
    error: createConsoleMethod(console.error),
    warn: createConsoleMethod(console.warn),
    info: createConsoleMethod(console.log),
    debug: createConsoleMethod(console.debug ?? console.log),
    trace: createConsoleMethod(console.debug ?? console.log),
    child(_bindings?: Record<string, unknown>): PinoLogger {
      return logger
    },
  }

  return logger
}

export { pino }
