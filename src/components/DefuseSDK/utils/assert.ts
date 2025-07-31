import { AssertionError } from "../errors/assert"

export type AssertErrorType = AssertionError

export function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(msg)
  }
}
