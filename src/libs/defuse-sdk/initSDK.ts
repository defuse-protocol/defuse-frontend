import { configureSDK } from "@defuse-protocol/defuse-sdk/config"
import * as Sentry from "@sentry/core"
import { INTENTS_ENV, NODE_IS_DEVELOPMENT } from "@src/utils/environment"

let hasInitialized = false

export function initSDK() {
  if (hasInitialized) {
    return
  }
  hasInitialized = true

  // TODO: Remove this workaround when Stellar is fully supported.
  // Note: initSDK may be called both on the server and the client.
  // On the client, it can be triggered inside a useEffect, so window is accessible.
  let stellarEnabled = false
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search)
    stellarEnabled = params.get("stellar") === "true"
  }

  if (NODE_IS_DEVELOPMENT) {
    configureSDK({
      env: INTENTS_ENV,
      logger: {
        verbose: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
      },
      features: {
        hyperliquid: true,
        ton: true,
        near_intents: true,
        sui: true,
        // TODO: Make it true when Stellar is supported
        stellar: stellarEnabled,
      },
    })
  } else {
    configureSDK({
      env: INTENTS_ENV,
      logger: {
        verbose: (msg, data) => {
          Sentry.addBreadcrumb({
            message: msg,
            category: "defuse-sdk",
            data: data,
          })
        },
        info: (msg, contexts) => {
          Sentry.captureMessage(msg, { contexts, level: "info" })
        },
        warn: (msg, contexts) => {
          Sentry.captureMessage(msg, { contexts, level: "warning" })
        },
        error: (err, contexts) => {
          Sentry.captureException(err, { contexts })
        },
      },
      features: {
        hyperliquid: true,
        ton: true,
        near_intents: true,
        sui: true,
        // TODO: Make it true when Stellar is supported
        stellar: stellarEnabled,
      },
    })
  }
}
