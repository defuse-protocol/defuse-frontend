export function toError(error: unknown): Error {
  if (error instanceof Error) return error
  return new Error(
    typeof error === "string" ? error : "An unexpected error occurred"
  )
}
