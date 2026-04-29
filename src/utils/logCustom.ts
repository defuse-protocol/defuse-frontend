import type { Primitive } from "@sentry/core"
import * as Sentry from "@sentry/nextjs"
import type { BaseTokenInfo } from "@src/components/DefuseSDK/types"

export function logNoLiquidity({
  tokenIn,
  tokenOut,
  amount,
  contexts,
  tags = {},
}: {
  tokenIn: BaseTokenInfo | undefined
  tokenOut: BaseTokenInfo | undefined
  amount: string
  contexts?: Sentry.Contexts | undefined
  tags?: Record<string, Primitive> | undefined
}) {
  Sentry.captureMessage(
    `No liquidity available for $${tokenIn?.symbol ?? "unknown"} (${tokenIn?.originChainName ?? "unknown"}) to $${tokenOut?.symbol ?? "unknown"} (${tokenOut?.originChainName ?? "unknown"})`,
    {
      level: "warning",
      tags: { "liquidity-alerts": true, amount, ...tags },
      contexts,
    }
  )
}
