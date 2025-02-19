export function toError(error: unknown): Error {
  if (error instanceof Error) return error
  return new Error(
    typeof error === "string" ? error : "An unexpected error occurred"
  )
}

export function hasMessage(
  err: unknown,
  searchText: string,
  options: {
    ignoreCase?: boolean
  } = {}
): boolean {
  if (!searchText) return false

  const error = toError(err)
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
