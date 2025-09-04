export type Result<T> =
  | {
      ok: T
      err?: never
    }
  | {
      ok?: never
      err: string
    }

export function ok<T>(data: T): {
  ok: T
  err?: never
} {
  return { ok: data }
}

export function err(err: string): {
  ok?: never
  err: string
} {
  return { err }
}

export function isOk<T>(result: Result<T>): result is { ok: T; err?: never } {
  return "ok" in result
}
