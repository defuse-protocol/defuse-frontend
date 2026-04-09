import {
  type QuoteConfig,
  type QuoteParams,
  solverRelayQuote,
} from "@src/actions/solverRelayProxy"
import {
  type LogNoLiquiditySolverRelayParams,
  logNoLiquiditySolverRelay,
} from "@src/utils/logCustom"
import { logger } from "@src/utils/logger"

export async function quoteWithLog(
  params: Omit<LogNoLiquiditySolverRelayParams, "requestId"> & QuoteParams,
  config: QuoteConfig
) {
  const requestId = crypto.randomUUID()
  const result = await solverRelayQuote(params, { ...config, requestId })
  if (result == null) {
    logger.warn("quote: No liquidity available", { quoteParams: params })

    if (
      config.logBalanceSufficient &&
      // We don't care about fast quotes, since they fail often
      (params.wait_ms == null || params.wait_ms > 2500)
    ) {
      logNoLiquiditySolverRelay({ ...params, requestId })
    }
  }
  return result
}
