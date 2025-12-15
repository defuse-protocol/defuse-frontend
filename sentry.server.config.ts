// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://68e98c6f1b314199f93ab8470623556c@o4510000873668621.ingest.us.sentry.io/4510000882778112",
  enabled: process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true",
  tracesSampleRate: 0,
  integrations: [
    Sentry.captureConsoleIntegration({
      levels: ["info", "warn", "error", "assert"],
    }),
  ],
  ignoreErrors: [
    // This warning pollutes the logs and is not actionable, happens on server only
    // node_modules/bigint-buffer/dist/node.js:10
    /^bigint: Failed to load bindings/,
  ],
})
