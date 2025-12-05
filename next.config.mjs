import withBundleAnalyzer from "@next/bundle-analyzer"
import { withSentryConfig } from "@sentry/nextjs"


/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
    resolveAlias: {
      // Node.js built-ins - stub for browser
      fs: { browser: "src/utils/empty.ts" },
      path: { browser: "src/utils/empty.ts" },
      os: { browser: "src/utils/empty.ts" },
      events: "events",

      // All imports of the `pino` package go to our shim.
      // This related to turbopack issue
      // https://github.com/vercel/next.js/issues/86099#issuecomment-3610573089
      pino: './src/shims/pino.ts',
      'thread-stream': './src/shims/thread-stream.ts',
    },
  },
  /**
   * pino, pino-pretty and thread-stream are here to fix this issue:
   * https://github.com/vercel/next.js/issues/86099#issuecomment-3610573089
   *
   * when this problem fixed, we can remove these packages from the serverExternalPackages and from package.json
   */
  serverExternalPackages: ['pino', 'pino-pretty', 'encoding'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
        port: "",
        pathname: "/coins/images/**",
      },
      {
        protocol: "https",
        hostname: "solver-relay.chaindefuser.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pro-api.coingecko.com",
        port: "",
        pathname: "/api/**",
      },
    ],
  },
}

/** @type {import('@sentry/nextjs').SentryBuildOptions} */
const sentryConfig = {
  org: "defuse-labs-ltd",
  project: "frontend",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  tunnelRoute: "/monitoring",
  automaticVercelMonitors: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
}

export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(
  process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true' ? withSentryConfig(nextConfig, sentryConfig) : nextConfig
)
