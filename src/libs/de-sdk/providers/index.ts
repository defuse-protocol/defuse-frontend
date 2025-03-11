import type { Settings } from "@src/libs/de-sdk/types/interfaces"
import { IS_DISABLE_QUOTING_FROM_SOLVER_0 } from "@src/utils/environment"

import { swapEstimateSolver0Provider } from "./solver0Provider"

// All other Solver Providers have to be included there
// Example:
//          swapEstimateSolver1Provider,
//          swapEstimateSolver2Provider,
//          ...,
export const estimateProviders: Settings = {
  providerIds: [],
}

if (!IS_DISABLE_QUOTING_FROM_SOLVER_0) {
  Object.assign(estimateProviders, {
    providerIds: [
      ...estimateProviders.providerIds,
      swapEstimateSolver0Provider,
    ],
  })
}
