import { configureSDK } from "@defuse-protocol/defuse-sdk/config"
import * as Sentry from "@sentry/core"

import { NODE_IS_DEVELOPMENT } from "@src/utils/environment"

let hasInitialized = false

export function initSDK() {
  if (hasInitialized) {
    return
  }
  hasInitialized = true

  if (NODE_IS_DEVELOPMENT) {
    configureSDK({
      logger: {
        verbose: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
      },
    })
  } else {
    configureSDK({
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
    })
  }
}
