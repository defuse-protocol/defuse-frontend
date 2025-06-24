import { NextResponse } from "next/server"

import type { ApiResult, ErrorResponse, ErrorWithStatus } from "./types"

export type Result<T, E> =
  | {
      ok: T
      err?: never
    }
  | {
      ok?: never
      err: E
    }

const ERROR_CODES = {
  "Bad Request": 400,
  "Not Found": 404,
  "Internal Server Error": 500,
} as const

type ErrorCode = keyof typeof ERROR_CODES

export function ok<T>(data: T): {
  ok: T
  err?: never
} {
  return { ok: data }
}

export function err(
  code: ErrorCode,
  message: string,
  issues?: ErrorResponse["issues"]
): {
  ok?: never
  err: ErrorWithStatus
} {
  return {
    err: {
      status: ERROR_CODES[code],
      error: {
        code,
        message,
        issues: issues ?? [],
      },
    },
  }
}

export function isErr<T>(result: Awaited<ApiResult<T>>): result is {
  ok?: never
  err: ErrorWithStatus
} {
  return "err" in result
}

export function tryCatch<T, Args extends unknown[]>(
  fn: (...args: Args) => ApiResult<T>
): (...args: Args) => Promise<NextResponse<T | ErrorResponse>> {
  return async (...args) => {
    const result = await (async () => {
      try {
        return await fn(...args)
      } catch (error) {
        console.error(error)
        return err("Internal Server Error", "Internal server error")
      }
    })()

    return result.err
      ? NextResponse.json(
          { ...result.err.error, issues: result.err.error.issues ?? [] },
          { status: result.err.status }
        )
      : NextResponse.json(result.ok)
  }
}
