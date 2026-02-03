import withBundleAnalyzer from "@next/bundle-analyzer"
import { withSentryConfig } from "@sentry/nextjs"
import * as path from "node:path"


/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  async headers() {
    return [
      {
        source: "/.well-known/webauthn",
        headers: [
          {
            key: "Content-Type",
            value: "application/json",
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/terms-of-service',
        destination: '/terms',
        permanent: true,
      },
      {
        source: '/terms-and-conditions',
        destination: '/terms',
        permanent: true,
      },
      {
        source: '/privacy-policy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/gift-card/view-gift',
        destination: '/gifts/view',
        permanent: true,
      },
      {
        source: '/gift-card/create-gift',
        destination: '/gifts/new',
        permanent: true,
      },
      {
        source: '/gift-card',
        destination: '/gifts',
        permanent: true,
      },
    ]
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
    resolveAlias: {
      fs: { browser: "src/utils/empty.ts" },
      path: { browser: "src/utils/empty.ts" },
      os: { browser: "src/utils/empty.ts" },
      events: "events",
    },
  },
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
