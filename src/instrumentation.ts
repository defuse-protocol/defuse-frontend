import * as Sentry from "@sentry/nextjs"

import { NEXT_RUNTIME_EDGE, NEXT_RUNTIME_NODE_JS } from "@src/utils/environment"

export async function register() {
  if (NEXT_RUNTIME_NODE_JS) {
    await import("../sentry.server.config")
  }

  if (NEXT_RUNTIME_EDGE) {
    await import("../sentry.edge.config")
  }
}

export const onRequestError = Sentry.captureRequestError
