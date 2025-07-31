type BaseErrorParameters = {
  cause?: unknown
  details?: string | undefined
  metaMessages?: string[] | undefined
  name?: string | undefined
}

export type BaseErrorType = BaseError & { name: "BaseError" }
export class BaseError extends Error {
  details: string
  metaMessages?: string[] | undefined
  shortMessage: string

  override name = "BaseError"

  constructor(shortMessage: string, args: BaseErrorParameters = {}) {
    const details = (() => {
      if (args.cause instanceof BaseError) return args.cause.details
      if (
        args.cause != null &&
        typeof args.cause === "object" &&
        "message" in args.cause &&
        typeof args.cause.message === "string"
      ) {
        return args.cause.message
      }
      return args.details ?? ""
    })()

    const message = [
      shortMessage || "An error occurred.",
      "",
      ...(args.metaMessages ? [...args.metaMessages, ""] : []),
      ...(details ? [`Details: ${details}`] : []),
    ].join("\n")

    super(message, args.cause ? { cause: args.cause } : undefined)

    this.details = details
    this.metaMessages = args.metaMessages
    this.name = args.name ?? this.name
    this.shortMessage = shortMessage
  }

  walk(): Error
  walk(fn: (err: unknown) => boolean): Error | null
  // biome-ignore lint/suspicious/noExplicitAny: `any` covers all overloads of `walk`
  walk(fn?: any): any {
    return walk(this, fn)
  }
}

function walk(
  err: unknown,
  fn?: ((err: unknown) => boolean) | undefined
): unknown {
  if (fn?.(err)) return err
  if (
    err &&
    typeof err === "object" &&
    "cause" in err &&
    err.cause !== undefined
  )
    return walk(err.cause, fn)
  return fn ? null : err
}
