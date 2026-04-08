import { BaseError } from "./base"

export type SolverRelayProxyErrorType = SolverRelayProxyError & {
  name: "SolverRelayProxyError"
}
export class SolverRelayProxyError extends BaseError {
  constructor(context: string, cause: unknown) {
    super(`Solver relay proxy failed: ${context}`, {
      cause,
      name: "SolverRelayProxyError",
    })
  }
}
