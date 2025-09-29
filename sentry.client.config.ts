// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"
import * as v from "valibot"
import { formatUnits } from "viem"

import { isBaseToken } from "@src/components/DefuseSDK/utils"
import { LIST_TOKENS } from "@src/constants/tokens"

Sentry.init({
  dsn: "https://68e98c6f1b314199f93ab8470623556c@o4510000873668621.ingest.us.sentry.io/4510000882778112",
  enabled: process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true",
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllInputs: false,
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  beforeSend: (event) => {
    return processNoLiquidityEvent(event)
  },
  // Navigation breadcrumbs may include sensitive user data (e.g., hashes), so we block them.
  // Otherwise, history URLs should be sanitized before being sent to Sentry.
  beforeBreadcrumb(breadcrumb) {
    return breadcrumb.category === "navigation" ? null : breadcrumb
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
  event_.tags["wait-ms"] = event.contexts.quoteParams.wait_ms
  event_.tags["amount-in"] = formatUnits(
    BigInt(event.contexts.quoteParams.exact_amount_in ?? 0),
    tokenIn?.decimals ?? 0
  )
  event_.tags["rpc-request-id"] = event.contexts.quoteRequestInfo.requestId
  event_.message = `No liquidity available for $${tokenIn?.symbol} (${tokenIn?.originChainName}) to $${tokenOut?.symbol} (${tokenOut?.originChainName})`
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
      wait_ms: v.optional(v.number()),
    }),
    quoteRequestInfo: v.object({
      requestId: v.string(),
    }),
  }),
})
