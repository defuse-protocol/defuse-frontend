// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://68e98c6f1b314199f93ab8470623556c@o4510000873668621.ingest.us.sentry.io/4510000882778112",
  enabled: process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true",
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.captureConsoleIntegration({
      levels: ["info", "warn", "error", "assert"],
    }),
    Sentry.replayIntegration({
      maskAllInputs: false,
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Navigation breadcrumbs may include sensitive user data (e.g., hashes), so we block them.
  // Otherwise, history URLs should be sanitized before being sent to Sentry.
  beforeBreadcrumb(breadcrumb) {
    return breadcrumb.category === "navigation" ? null : breadcrumb
  },
})
