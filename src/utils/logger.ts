import type { solverRelay } from "@defuse-protocol/internal-utils"
import type { Primitive } from "@sentry/core"
import * as Sentry from "@sentry/nextjs"
import type { BaseTokenInfo } from "@src/components/DefuseSDK/types"
import { isBaseToken } from "@src/components/DefuseSDK/utils"
import { LIST_TOKENS } from "@src/constants/tokens"
import { formatUnits } from "viem"

export type Context = Record<string, unknown>

export interface ILogger {
  trace: (message: string, context?: Context) => void
  info: (message: string, context?: Context) => void
  warn: (message: string, context?: Context) => void
  error: (message: string | Error | unknown, context?: Context) => void
}

export const logger: ILogger = console

export function logNoLiquidity({
  tokenIn,
  tokenOut,
  amountIn,
  contexts,
  tags = {},
}: {
  tokenIn: BaseTokenInfo | undefined
  tokenOut: BaseTokenInfo | undefined
  amountIn: string
  contexts?: Sentry.Contexts | undefined
  tags?: Record<string, Primitive> | undefined
}) {
  Sentry.captureMessage(
    `No liquidity available for $${tokenIn?.symbol} (${tokenIn?.originChainName}) to $${tokenOut?.symbol} (${tokenOut?.originChainName})`,
    {
      level: "warning",
      tags: {
        "liquidity-alerts": true,
        "amount-in": amountIn,
        ...tags,
      },
      contexts,
    }
  )
}

export function logNoLiquiditySolverRelay({
  requestId,
  ...quoteParams
}: Parameters<typeof solverRelay.quote>[0] & { requestId: string }) {
  const tokenIn = toToken(quoteParams.defuse_asset_identifier_in)

  logNoLiquidity({
    tokenIn,
    tokenOut: toToken(quoteParams.defuse_asset_identifier_out),
    amountIn: formatUnits(
      BigInt(quoteParams.exact_amount_in ?? 0),
      tokenIn?.decimals ?? 0
    ),
    contexts: { quoteParams, quoteRequestInfo: { requestId } },
    tags: { "wait-ms": quoteParams.wait_ms, "rpc-request-id": requestId },
  })
}

function toToken(defuseAssetId: string) {
  for (const token of LIST_TOKENS) {
    if (isBaseToken(token)) {
      if (token.defuseAssetId === defuseAssetId) {
        return token
      }
    } else {
      for (const t of token.groupedTokens) {
        if (t.defuseAssetId === defuseAssetId) {
          return t
        }
      }
    }
  }
}
