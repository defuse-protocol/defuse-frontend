import { errors } from "@defuse-protocol/internal-utils"

export function hasMessage(
  err: unknown,
  searchText: string,
  options: {
    ignoreCase?: boolean
  } = {}
): boolean {
  if (!searchText) return false

  const error = errors.toError(err)
  const search = options.ignoreCase ? searchText.toLowerCase() : searchText

  const matches = (text: string) =>
    options.ignoreCase
      ? text.toLowerCase().includes(search)
      : text.includes(search)

  if (matches(error.message)) return true

  let current = error
  while (current.cause instanceof Error) {
    if (matches(current.cause.message)) return true
    current = current.cause
  }
  return false
}

export function findError<T extends Error>(
  err: unknown,
  // biome-ignore lint/suspicious/noExplicitAny: any is required for the constructor type
  errorType: new (...args: any[]) => T
): T | null {
  const error = errors.toError(err)

  if (error instanceof errorType) return error

  let current = error
  while (current.cause instanceof Error) {
    if (current.cause instanceof errorType) {
      return current.cause
    }
    current = current.cause
  }
  return null
}
