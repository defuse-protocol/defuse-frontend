// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { isBaseToken } from "@defuse-protocol/defuse-sdk"
import * as Sentry from "@sentry/nextjs"
import { LIST_TOKENS } from "@src/constants/tokens"
import * as v from "valibot"
import { formatUnits } from "viem"

Sentry.init({
  dsn: "https://12f8f38e9e78e2900f386bec2549c9d7@o4504157766942720.ingest.us.sentry.io/4507589484544000",
  enabled: process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true",
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    // eslint-disable-next-line import/namespace
    Sentry.replayIntegration({
      maskAllInputs: false,
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  beforeSend: (event) => {
    return processNoLiquidityEvent(event)
  },
})

function processNoLiquidityEvent(event: Sentry.ErrorEvent) {
  if (!v.is(noLiquidityEventSchema, event)) {
    return event
  }

  const tokenIn = toToken(event.contexts.quoteParams.defuse_asset_identifier_in)
  const tokenOut = toToken(
    event.contexts.quoteParams.defuse_asset_identifier_out
  )

  const event_: Sentry.ErrorEvent = event
  event_.tags ??= {}
  event_.tags["liquidity-alerts"] = true
  event_.tags["amount-in"] = formatUnits(
    BigInt(event.contexts.quoteParams.exact_amount_in ?? 0),
    tokenIn?.decimals ?? 0
  )
  event_.tags["rpc-request-id"] = event.contexts.quoteRequestInfo.requestId
  event_.message = `No liquidity available for $${tokenIn?.symbol} (${tokenIn?.chainName}) to $${tokenOut?.symbol} (${tokenOut?.chainName})`
  return event_
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

const noLiquidityEventSchema = v.object({
  message: v.literal(
    "quote: No liquidity available for user with sufficient balance"
  ),
  contexts: v.object({
    quoteParams: v.object({
      defuse_asset_identifier_in: v.string(),
      defuse_asset_identifier_out: v.string(),
      exact_amount_in: v.optional(v.string()),
    }),
    quoteRequestInfo: v.object({
      requestId: v.string(),
    }),
  }),
})
