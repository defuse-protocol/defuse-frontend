import { setLogger } from "@defuse-protocol/defuse-sdk/logger"
import * as Sentry from "@sentry/core"

let hasInitialized = false

export function initSDK() {
  if (hasInitialized) {
    return
  }
  hasInitialized = true

  if (process.env.NODE_ENV === "development") {
    setLogger({
      verbose: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    })
  } else {
    setLogger({
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
    })
  }
}
