import { BaseError } from "./base"

export type AssertionErrorType = AssertionError & { name: "AssertionError" }
export class AssertionError extends BaseError {
  constructor(message: string | undefined) {
    super(message || "Assertion failed", {
      name: "AssertionError",
    })
  }
}
