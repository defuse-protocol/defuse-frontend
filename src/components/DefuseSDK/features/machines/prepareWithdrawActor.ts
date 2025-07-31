import { fromPromise } from "xstate"
import { prepareWithdraw } from "../../services/withdrawService"

export type { PreparationOutput } from "../../services/withdrawService"

export const prepareWithdrawActor = fromPromise(
  ({
    input,
    signal,
  }: {
    input: Parameters<typeof prepareWithdraw>[0]
    signal: AbortSignal
  }) => {
    return prepareWithdraw(input, { signal })
  }
)
