import { solverRelay } from "@defuse-protocol/internal-utils"
import {
  type LogNoLiquiditySolverRelayParams,
  logNoLiquiditySolverRelay,
} from "@src/utils/logCustom"
import { logger } from "@src/utils/logger"

export async function quoteWithLog(
  params: Omit<LogNoLiquiditySolverRelayParams, "requestId">,
  {
    logBalanceSufficient,
    ...config
  }: { logBalanceSufficient: boolean } & Parameters<typeof solverRelay.quote>[1]
) {
  const requestId = crypto.randomUUID()
  const result = await solverRelay.quote(params, { ...config, requestId })
  if (result == null) {
    logger.warn("quote: No liquidity available", { quoteParams: params })

    if (
      logBalanceSufficient &&
      // We don't care about fast quotes, since they fail often
      (params.wait_ms == null || params.wait_ms > 2500)
    ) {
      logNoLiquiditySolverRelay({ ...params, requestId })
    }
  }
  return result
}
