import * as Sentry from "@sentry/nextjs"

import { RUNTIME_EDGE, RUNTIME_NODE_JS } from "@src/utils/environment"

export async function register() {
  if (RUNTIME_EDGE) {
    await import("../sentry.server.config")
  }

  if (RUNTIME_NODE_JS) {
    await import("../sentry.edge.config")
  }
}

export const onRequestError = Sentry.captureRequestError
