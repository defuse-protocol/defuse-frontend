import { fromPromise } from "xstate"
import { prepareDeposit } from "../../services/depositService"

export type { PreparationOutput } from "../../services/depositService"

export const prepareDepositActor = fromPromise(
  ({
    input,
    signal,
  }: {
    input: Parameters<typeof prepareDeposit>[0]
    signal: AbortSignal
  }) => {
    return prepareDeposit(input, { signal })
  }
)
